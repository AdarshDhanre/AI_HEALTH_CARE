package com.medicase.controller;

import com.medicase.dto.request.CaseRequest;
import com.medicase.dto.response.CaseResponse;
import com.medicase.service.AuthService;
import com.medicase.service.CaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/cases")
@RequiredArgsConstructor
public class CaseController {
    private final CaseService cases;
    private final AuthService auth;

    @PostMapping
    public CaseResponse create(@PathVariable Long patientId, @RequestBody CaseRequest req) {
        return cases.create(auth.currentUser(), patientId, req);
    }

    @GetMapping
    public List<CaseResponse> list(@PathVariable Long patientId) {
        return cases.list(auth.currentUser(), patientId);
    }
}
