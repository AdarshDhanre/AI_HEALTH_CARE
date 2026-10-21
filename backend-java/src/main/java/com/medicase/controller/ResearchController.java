package com.medicase.controller;

import com.medicase.service.AnonymizationService;
import com.medicase.service.AnonymizationService.AnonymizedPatient;
import com.medicase.service.AnonymizationService.Analytics;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/research")
@RequiredArgsConstructor
public class ResearchController {
    private final AnonymizationService anonymization;

    @GetMapping("/analytics")
    public Analytics analytics() {
        return anonymization.analytics();
    }

    @GetMapping("/cohort")
    public List<AnonymizedPatient> cohort() {
        return anonymization.cohort();
    }
}
