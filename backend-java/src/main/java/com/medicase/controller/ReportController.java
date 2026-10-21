package com.medicase.controller;

import com.medicase.dto.request.LabResultUpdateRequest;
import com.medicase.dto.response.LabResultResponse;
import com.medicase.dto.response.ReportResponse;
import com.medicase.service.AuthService;
import com.medicase.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reports;
    private final AuthService auth;

    @PostMapping("/reports/upload")
    public ReportResponse upload(@RequestParam Long patientId,
                                 @RequestParam("file") MultipartFile file,
                                 @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportDate,
                                 @RequestParam(required = false) String language) {
        return reports.upload(auth.currentUser(), patientId, file, reportDate, language);
    }

    @GetMapping("/patients/{patientId}/reports")
    public List<ReportResponse> list(@PathVariable Long patientId) {
        return reports.listForPatient(auth.currentUser(), patientId);
    }

    @GetMapping("/reports/{id}")
    public ReportResponse get(@PathVariable Long id, @RequestParam(required = false) String language) {
        return reports.getReport(auth.currentUser(), id, language);
    }

    @PutMapping("/reports/{id}/results/{resultId}")
    public LabResultResponse update(@PathVariable Long id, @PathVariable Long resultId,
                                    @RequestBody LabResultUpdateRequest req) {
        return reports.updateResult(auth.currentUser(), id, resultId, req);
    }

    @PostMapping("/reports/{id}/confirm")
    public ReportResponse confirm(@PathVariable Long id) {
        return reports.confirm(auth.currentUser(), id);
    }
}
