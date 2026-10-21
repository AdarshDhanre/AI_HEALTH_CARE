package com.medicase.dto.response;

import com.medicase.entity.CaseRecord;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CaseResponse(Long id, Long patientId, String chiefComplaint, String symptoms, String medicalHistory,
                           String lifestyle, Map<String, Object> ayushDetails, String notes, Instant createdAt,
                           List<Map<String, String>> missingInfo) {
    public static CaseResponse from(CaseRecord c, List<Map<String, String>> missing) {
        return new CaseResponse(c.getId(), c.getPatient().getId(), c.getChiefComplaint(), c.getSymptoms(),
                c.getMedicalHistory(), c.getLifestyle(), c.getAyushDetails(), c.getNotes(), c.getCreatedAt(), missing);
    }
}
