package com.medicase.controller;

import com.medicase.client.AiServiceClient;
import com.medicase.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patient-interview")
@RequiredArgsConstructor
public class PatientInterviewController {
    private final AiServiceClient aiClient;
    private final AuthService auth;

    @PostMapping("/summary")
    public Map<String, Object> summary(@RequestBody Map<String, Object> request) {
        // Require a valid logged-in user; the endpoint is not public.
        auth.currentUser();
        Object language = request.getOrDefault("language", "en");
        Object answers = request.get("answers");
        if (!(answers instanceof Map<?, ?>)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "answers must be an object");
        }
        return aiClient.createPatientInterviewSummary(Map.of("language", language, "answers", answers));
    }
}
