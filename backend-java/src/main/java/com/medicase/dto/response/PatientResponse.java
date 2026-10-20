package com.medicase.dto.response;

import com.medicase.entity.Patient;

import java.time.LocalDate;

public record PatientResponse(Long id, String patientUid, String name, LocalDate dob, String gender, String phone,
                              String dietPref, String preferredLanguage, Long doctorId) {
    public static PatientResponse from(Patient p) {
        return new PatientResponse(p.getId(), p.getPatientUid(), p.getName(), p.getDob(), p.getGender(), p.getPhone(),
                p.getDietPref(), p.getPreferredLanguage(), p.getDoctor() == null ? null : p.getDoctor().getId());
    }
}
