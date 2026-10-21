package com.medicase.controller;

import com.medicase.dto.response.ComparisonRow;
import com.medicase.dto.response.DashboardResponse;
import com.medicase.dto.response.TrendResponse;
import com.medicase.service.AuthService;
import com.medicase.service.TrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}")
@RequiredArgsConstructor
public class TrendController {
    private final TrendService trends;
    private final AuthService auth;

    @GetMapping("/tests")
    public List<String> tests(@PathVariable Long patientId) {
        return trends.tests(auth.currentUser(), patientId);
    }

    @GetMapping("/trends")
    public TrendResponse trend(@PathVariable Long patientId, @RequestParam String test) {
        return trends.trend(auth.currentUser(), patientId, test);
    }

    @GetMapping("/compare")
    public List<ComparisonRow> compare(@PathVariable Long patientId) {
        return trends.compare(auth.currentUser(), patientId);
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(@PathVariable Long patientId) {
        return trends.dashboard(auth.currentUser(), patientId);
    }
}
