package com.medicase.service;

import com.medicase.dto.request.CaseRequest;
import com.medicase.dto.response.CaseResponse;
import com.medicase.entity.CaseRecord;
import com.medicase.entity.Patient;
import com.medicase.entity.User;
import com.medicase.enums.Role;
import com.medicase.repository.CaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CaseService {
    private static final String[][] AYUSH = {{"prakriti", "Prakriti (body constitution)"}, {"agni", "Agni (digestion)"},
            {"koshtha", "Koshtha (bowel habit)"}, {"nidra", "Nidra (sleep)"}};

    private final CaseRepository cases;
    private final PatientService patientService;
    private final AuditService audit;

    public CaseResponse create(User actor, Long patientId, CaseRequest req) {
        if (actor.getRole() != Role.DOCTOR) throw new AccessDeniedException("Only practitioners can record cases");
        Patient p = patientService.getAccessible(patientId, actor);
        CaseRecord c = new CaseRecord();
        c.setPatient(p);
        c.setDoctor(actor);
        c.setChiefComplaint(req.chiefComplaint());
        c.setSymptoms(req.symptoms());
        c.setMedicalHistory(req.medicalHistory());
        c.setLifestyle(req.lifestyle());
        c.setAyushDetails(req.ayushDetails());
        c.setNotes(req.notes());
        c = cases.save(c);
        audit.log(actor, "CASE_CREATE", "CaseRecord", c.getId(), "patient=" + patientId);
        return CaseResponse.from(c, missing(c));
    }

    public List<CaseResponse> list(User actor, Long patientId) {
        patientService.getAccessible(patientId, actor);
        return cases.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(c -> CaseResponse.from(c, missing(c))).toList();
    }

    /** Prompts the practitioner for fields that are still empty (mirrors the AI service's /missing-info). */
    private static List<Map<String, String>> missing(CaseRecord c) {
        List<Map<String, String>> out = new ArrayList<>();
        add(out, "chief_complaint", "Chief complaint", c.getChiefComplaint());
        add(out, "medical_history", "Past medical history", c.getMedicalHistory());
        add(out, "lifestyle", "Lifestyle (diet, sleep, activity)", c.getLifestyle());
        Map<String, Object> ay = c.getAyushDetails();
        for (String[] a : AYUSH) {
            Object v = ay == null ? null : ay.get(a[0]);
            add(out, "ayush_details." + a[0], a[1], v == null ? null : v.toString());
        }
        return out;
    }

    private static void add(List<Map<String, String>> out, String field, String label, String value) {
        if (value == null || value.isBlank()) {
            Map<String, String> m = new LinkedHashMap<>();
            m.put("field", field);
            m.put("label", label);
            out.add(m);
        }
    }
}
