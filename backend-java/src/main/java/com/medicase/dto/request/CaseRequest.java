package com.medicase.dto.request;

import java.util.Map;

public record CaseRequest(String chiefComplaint, String symptoms, String medicalHistory, String lifestyle,
                          Map<String, Object> ayushDetails, String notes) {}
