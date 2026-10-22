package com.medicase.dto.request;

public record LabResultUpdateRequest(String testName, Double value, String unit, Double refLow, Double refHigh) {}
