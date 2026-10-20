package com.medicase.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record PatientRequest(@NotBlank String name, LocalDate dob, String gender, String phone,
                             String dietPref, String preferredLanguage) {}
