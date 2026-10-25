package com.medicase.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record AadhaarLoginRequest(
    @NotBlank String aadhaarNumber,
    String fullName,
    String dob,
    String gender,
    String phone,
    @NotBlank String otp,
    @JsonProperty("ref_id") String ref_id,
    @JsonProperty("refId") String refId
) {
    public String effectiveRefId() {
        if (refId != null && !refId.isBlank()) return refId.trim();
        if (ref_id != null && !ref_id.isBlank()) return ref_id.trim();
        return "";
    }
}
