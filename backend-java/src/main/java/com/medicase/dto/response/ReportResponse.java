package com.medicase.dto.response;

import com.medicase.entity.Report;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ReportResponse(Long id, Long patientId, String status, boolean reviewed, LocalDate reportDate,
                             String labName, String originalFilename, String errorMessage, Instant createdAt,
                             List<LabResultResponse> results, SummaryDto summary) {

    public record SummaryDto(String language, String overallLevel, String summaryText, Map<String, Object> guidance) {}

    public static ReportResponse from(Report r, List<LabResultResponse> results, SummaryDto summary) {
        return new ReportResponse(r.getId(), r.getPatient().getId(), r.getStatus().name(), r.isReviewed(), r.getReportDate(),
                r.getLabName(), r.getOriginalFilename(), r.getErrorMessage(), r.getCreatedAt(), results, summary);
    }
}
