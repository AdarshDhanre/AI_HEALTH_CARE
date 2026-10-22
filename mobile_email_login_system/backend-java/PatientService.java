package com.medicase.service;

import com.medicase.dto.request.PatientRequest;
import com.medicase.entity.Patient;
import com.medicase.entity.User;
import com.medicase.enums.Role;
import com.medicase.exception.ResourceNotFoundException;
import com.medicase.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;
import java.util.Set;

/**
 * Access rule: a doctor sees only their own patients, a patient sees only their own records.
 * Admins manage accounts but do NOT see clinical data; researchers only get anonymised aggregates.
 */
@Service
@RequiredArgsConstructor
public class PatientService {
    private static final Set<String> DIETS = Set.of("VEGETARIAN", "NON_VEGETARIAN", "VEGAN");
    private static final Set<String> LANGS = Set.of("en", "hi", "mr");
    private static final SecureRandom RNG = new SecureRandom();

    private final PatientRepository patients;
    private final AuditService audit;

    public List<Patient> list(User actor) {
        return switch (actor.getRole()) {
            case DOCTOR -> patients.findByDoctorIdOrderByIdDesc(actor.getId());
            case PATIENT -> patients.findByUserIdOrderByIdDesc(actor.getId());
            default -> throw new AccessDeniedException("Your role cannot view patient records");
        };
    }

    public Patient create(User actor, PatientRequest req) {
        if (actor.getRole() != Role.DOCTOR && actor.getRole() != Role.PATIENT)
            throw new AccessDeniedException("Your role cannot register patients");
        Patient p = new Patient();
        p.setPatientUid(newUid());
        p.setName(req.name().trim());
        p.setDob(req.dob());
        p.setGender(req.gender());
        p.setPhone(req.phone());\n        p.setEmail(req.email());
        p.setDietPref(req.dietPref() != null && DIETS.contains(req.dietPref()) ? req.dietPref() : "VEGETARIAN");
        p.setPreferredLanguage(req.preferredLanguage() != null && LANGS.contains(req.preferredLanguage()) ? req.preferredLanguage() : "en");
        if (actor.getRole() == Role.DOCTOR) p.setDoctor(actor); else p.setUser(actor);
        p = patients.save(p);
        audit.log(actor, "PATIENT_CREATE", "Patient", p.getId(), p.getPatientUid());
        return p;
    }

    public Patient getAccessible(Long id, User actor) {
        Patient p = patients.findById(id).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        assertAccess(actor, p);
        return p;
    }

    public void assertAccess(User actor, Patient p) {
        boolean ok = switch (actor.getRole()) {
            case DOCTOR -> p.getDoctor() != null && p.getDoctor().getId().equals(actor.getId());
            case PATIENT -> p.getUser() != null && p.getUser().getId().equals(actor.getId());
            default -> false;
        };
        if (!ok) throw new AccessDeniedException("You do not have access to this patient");
    }

    public String newUid() {
        String uid;
        do {
            uid = "MC-" + String.format("%08d", RNG.nextInt(100_000_000));
        } while (patients.existsByPatientUid(uid));
        return uid;
    }
}
