package com.medicase.service;

import com.medicase.client.AiServiceClient;
import com.medicase.client.AiServiceClient.AiLabResult;
import com.medicase.client.AiServiceClient.ProcessResponse;
import com.medicase.dto.request.LabResultUpdateRequest;
import com.medicase.dto.response.LabResultResponse;
import com.medicase.dto.response.ReportResponse;
import com.medicase.dto.response.ReportResponse.SummaryDto;
import com.medicase.entity.AiSummary;
import com.medicase.entity.LabResult;
import com.medicase.entity.Patient;
import com.medicase.entity.Report;
import com.medicase.entity.User;
import com.medicase.enums.ReportStatus;
import com.medicase.enums.ResultFlag;
import com.medicase.enums.Role;
import com.medicase.exception.ResourceNotFoundException;
import com.medicase.repository.AiSummaryRepository;
import com.medicase.repository.LabResultRepository;
import com.medicase.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.LocalDate;
import java.util.*;

/**
 * Upload -> store -> FastAPI (OCR/extract/validate) -> save rows -> summary.
 * Deliberately NOT one big transaction: the slow AI call must not hold a DB connection,
 * and a FAILED status must still be persisted when processing blows up.
 */
@Service
@RequiredArgsConstructor
public class ReportService {
    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private static final Set<String> LANGS = Set.of("en", "hi", "mr");

    private final ReportRepository reports;
    private final LabResultRepository labResults;
    private final AiSummaryRepository summaries;
    private final PatientService patientService;
    private final FileStorageService storage;
    private final AiServiceClient ai;
    private final AuditService audit;
    private final NotificationService notifications;

    // ------------------------------------------------------------------ upload
    public ReportResponse upload(User actor, Long patientId, MultipartFile file, LocalDate reportDate, String language) {
        Patient patient = patientService.getAccessible(patientId, actor);
        Path path = storage.store(file);

        Report report = new Report();
        report.setPatient(patient);
        report.setUploadedBy(actor);
        report.setFilePath(path.toString());
        report.setOriginalFilename(cleanName(file.getOriginalFilename()));
        report.setStatus(ReportStatus.PROCESSING);
        final Report saved = reports.save(report);
        audit.log(actor, "REPORT_UPLOAD", "Report", saved.getId(), saved.getOriginalFilename());

        String lang = resolveLang(language, patient);
        try {
            ProcessResponse pr = ai.processReport(path);
            saved.setLabName(pr.labName());
            LocalDate detected = parseDate(pr.reportDate());
            saved.setReportDate(reportDate != null ? reportDate : detected != null ? detected : LocalDate.now());

            List<LabResult> rows = new ArrayList<>();
            for (AiLabResult r : pr.results()) rows.add(toEntity(saved, r));
            labResults.saveAll(rows);

            saved.setStatus(ReportStatus.DONE);
            reports.save(saved);

            try {
                generateSummary(saved, rows, lang);
            } catch (Exception e) {
                log.warn("Summary generation failed for report {}: {}", saved.getId(), e.getMessage());
            }
            boolean critical = rows.stream().anyMatch(r -> r.getFlag() == ResultFlag.CRITICAL);
            notifications.reportProcessed(actor.getEmail(), patient.getName(), saved.getId(), critical);
        } catch (Exception e) {
            log.error("Report {} failed", saved.getId(), e);
            saved.setStatus(ReportStatus.FAILED);
            saved.setErrorMessage(truncate(e.getMessage(), 500));
            reports.save(saved);
        }
        return getReport(actor, saved.getId(), lang);
    }

    // -------------------------------------------------------------------- read
    public ReportResponse getReport(User actor, Long id, String language) {
        Report r = load(id);
        patientService.assertAccess(actor, r.getPatient());
        List<LabResult> results = labResults.findByReportIdOrderById(id);
        String lang = resolveLang(language, r.getPatient());

        SummaryDto summary = null;
        if (r.getStatus() == ReportStatus.DONE && !results.isEmpty()) {
            try {
                AiSummary s = summaries.findByReportIdAndLanguage(id, lang)
                        .orElseGet(() -> generateSummary(r, results, lang));
                summary = new SummaryDto(s.getLanguage(), s.getOverallLevel(), s.getSummaryText(), s.getGuidanceJson());
            } catch (Exception e) {
                log.warn("Summary unavailable for report {}: {}", id, e.getMessage());
            }
        }
        audit.log(actor, "REPORT_VIEW", "Report", id, null);
        return ReportResponse.from(r, results.stream().map(LabResultResponse::from).toList(), summary);
    }

    public List<ReportResponse> listForPatient(User actor, Long patientId) {
        patientService.getAccessible(patientId, actor);
        return reports.findByPatientIdOrderByReportDateDescIdDesc(patientId).stream()
                .map(r -> ReportResponse.from(r,
                        labResults.findByReportIdOrderById(r.getId()).stream().map(LabResultResponse::from).toList(), null))
                .toList();
    }

    // ------------------------------------------------- practitioner review/edit
    public LabResultResponse updateResult(User actor, Long reportId, Long resultId, LabResultUpdateRequest req) {
        requirePractitioner(actor);
        Report report = load(reportId);
        patientService.assertAccess(actor, report.getPatient());
        LabResult row = labResults.findById(resultId).orElseThrow(() -> new ResourceNotFoundException("Result not found"));
        if (!row.getReport().getId().equals(reportId)) throw new IllegalArgumentException("Result does not belong to this report");

        if (req.testName() != null && !req.testName().isBlank()) row.setTestName(req.testName().trim());
        if (req.value() != null) row.setValue(req.value());
        if (req.unit() != null) row.setUnit(req.unit());
        row.setRefLow(req.refLow());
        row.setRefHigh(req.refHigh());

        Map<String, Object> body = new HashMap<>();
        body.put("test_name", row.getTestName());
        body.put("value", row.getValue());
        body.put("unit", row.getUnit());
        body.put("ref_low", row.getRefLow());
        body.put("ref_high", row.getRefHigh());
        Map<String, Object> eval = ai.evaluate(body);                 // flag is recomputed by rules, not typed by hand
        row.setFlag(toFlag((String) eval.get("flag")));
        row.setSafetyLevel(String.valueOf(eval.getOrDefault("safety_level", "GREY")));
        row.setEditedByDoctor(true);
        row.setNeedsReview(false);
        row = labResults.save(row);

        summaries.deleteByReportId(reportId);                         // explanations are regenerated on next view
        audit.log(actor, "RESULT_EDIT", "LabResult", resultId, "report=" + reportId);
        return LabResultResponse.from(row);
    }

    public ReportResponse confirm(User actor, Long reportId) {
        requirePractitioner(actor);
        Report r = load(reportId);
        patientService.assertAccess(actor, r.getPatient());
        r.setReviewed(true);
        reports.save(r);
        audit.log(actor, "REPORT_CONFIRM", "Report", reportId, null);
        return getReport(actor, reportId, null);
    }

    // ----------------------------------------------------------------- helpers
    private AiSummary generateSummary(Report report, List<LabResult> rows, String lang) {
        List<Map<String, Object>> payload = new ArrayList<>();
        for (LabResult r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("test_name", r.getTestName());
            m.put("value", r.getValue());
            m.put("unit", r.getUnit());
            m.put("ref_low", r.getRefLow());
            m.put("ref_high", r.getRefHigh());
            m.put("flag", r.getFlag().name());
            payload.add(m);
        }
        Map<String, Object> resp = ai.summary(lang, report.getPatient().getDietPref(), payload);

        AiSummary s = summaries.findByReportIdAndLanguage(report.getId(), lang).orElseGet(AiSummary::new);
        s.setReport(report);
        s.setLanguage(lang);
        s.setSummaryText((String) resp.get("summary_text"));
        s.setOverallLevel((String) resp.get("overall_level"));
        s.setGuidanceJson(resp);
        return summaries.save(s);
    }

    private LabResult toEntity(Report report, AiLabResult r) {
        LabResult e = new LabResult();
        e.setReport(report);
        e.setTestName(r.testName());
        e.setRawName(r.rawName());
        e.setValue(r.value());
        e.setUnit(r.unit());
        e.setRefLow(r.refLow());
        e.setRefHigh(r.refHigh());
        e.setRefText(r.refText());
        e.setFlag(toFlag(r.flag()));
        e.setSafetyLevel(r.safetyLevel() == null ? "GREY" : r.safetyLevel());
        e.setConfidence(r.confidence());
        e.setNeedsReview(r.needsReview());
        return e;
    }

    private static ResultFlag toFlag(String f) {
        try {
            return ResultFlag.valueOf(f);
        } catch (Exception e) {
            return ResultFlag.UNKNOWN;
        }
    }

    private Report load(Long id) {
        return reports.findById(id).orElseThrow(() -> new ResourceNotFoundException("Report not found"));
    }

    private static void requirePractitioner(User actor) {
        if (actor.getRole() != Role.DOCTOR && actor.getRole() != Role.ADMIN)
            throw new AccessDeniedException("Only practitioners can review or edit results");
    }

    private static String resolveLang(String requested, Patient p) {
        if (requested != null && LANGS.contains(requested)) return requested;
        return LANGS.contains(p.getPreferredLanguage()) ? p.getPreferredLanguage() : "en";
    }

    private static LocalDate parseDate(String s) {
        try {
            return s == null ? null : LocalDate.parse(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static String cleanName(String n) {
        if (n == null) return "report";
        String base = n.replace("\\", "/");
        base = base.substring(base.lastIndexOf('/') + 1);
        return truncate(base.replaceAll("[^A-Za-z0-9._ -]", "_"), 200);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
