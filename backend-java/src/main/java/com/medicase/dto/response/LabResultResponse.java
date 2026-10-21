package com.medicase.dto.response;

import com.medicase.entity.LabResult;

public record LabResultResponse(Long id, String testName, String rawName, Double value, String unit, Double refLow,
                                Double refHigh, String refText, String flag, String safetyLevel, Double confidence,
                                boolean needsReview, boolean editedByDoctor) {
    public static LabResultResponse from(LabResult r) {
        return new LabResultResponse(r.getId(), r.getTestName(), r.getRawName(), r.getValue(), r.getUnit(), r.getRefLow(),
                r.getRefHigh(), r.getRefText(), r.getFlag().name(), r.getSafetyLevel(), r.getConfidence(),
                r.isNeedsReview(), r.isEditedByDoctor());
    }
}
