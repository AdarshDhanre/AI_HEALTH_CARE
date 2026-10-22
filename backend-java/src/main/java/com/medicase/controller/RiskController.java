package com.medicase.controller;

import com.medicase.client.AiServiceClient;
import com.medicase.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskController {

    private final AiServiceClient aiClient;
    private final AuthService auth;

    @PostMapping("/predict")
    public Map<String, Object> predict(@RequestBody Map<String, Object> request) {
        auth.currentUser();
        return aiClient.predictRisk(request);
    }

    @PostMapping("/analyze-symptom-text")
    public Map<String, Object> analyzeSymptomText(@RequestBody Map<String, Object> request) {
        auth.currentUser();
        return aiClient.analyzeSymptomText(request);
    }
}
