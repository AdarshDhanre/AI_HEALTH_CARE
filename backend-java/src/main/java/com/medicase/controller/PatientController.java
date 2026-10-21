package com.medicase.controller;

import com.medicase.dto.request.PatientRequest;
import com.medicase.dto.response.PatientResponse;
import com.medicase.service.AuthService;
import com.medicase.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {
    private final PatientService patients;
    private final AuthService auth;

    @GetMapping
    public List<PatientResponse> list() {
        return patients.list(auth.currentUser()).stream().map(PatientResponse::from).toList();
    }

    @PostMapping
    public PatientResponse create(@Valid @RequestBody PatientRequest req) {
        return PatientResponse.from(patients.create(auth.currentUser(), req));
    }

    @GetMapping("/{id}")
    public PatientResponse get(@PathVariable Long id) {
        return PatientResponse.from(patients.getAccessible(id, auth.currentUser()));
    }
}
