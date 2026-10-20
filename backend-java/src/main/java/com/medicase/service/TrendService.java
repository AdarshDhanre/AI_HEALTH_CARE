package com.medicase.service;

import com.medicase.dto.response.ComparisonRow;
import com.medicase.dto.response.DashboardResponse;
import com.medicase.dto.response.TrendResponse;
import com.medicase.entity.LabResult;
import com.medicase.entity.Report;
import com.medicase.entity.User;
import com.medicase.enums.ReportStatus;
import com.medicase.repository.LabResultRepository;
import com.medicase.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class TrendService {
    private final PatientService patientService;
    private final LabResultRepository labResults;
    private final ReportRepository reports;

    public List<String> tests(User actor, Long patientId) {
        patientService.getAccessible(patientId, actor);
        return labResults.findTestNames(patientId, ReportStatus.DONE);
    }

    public TrendResponse trend(User actor, Long patientId, String test) {
        patientService.getAccessible(patientId, actor);
        List<LabResult> history = labResults.findHistory(patientId, test, ReportStatus.DONE);
        List<TrendResponse.Point> points = history.stream()
                .map(r -> new TrendResponse.Point(r.getReport().getReportDate(), r.getValue(), r.getFlag().name(), r.getReport().getId()))
                .toList();

        LabResult last = history.isEmpty() ? null : history.get(history.size() - 1);
        String direction = "INSUFFICIENT";
        String message = "Upload at least 3 reports to see a trend.";
        if (history.size() >= 3) {
            double a = history.get(history.size() - 3).getValue();
            double b = history.get(history.size() - 2).getValue();
            double c = last.getValue();
            if (a < b && b < c) {
                direction = "INCREASING";
                message = "Your " + test + " has increased across the last 3 uploaded reports. Consider discussing this trend with a healthcare professional.";
            } else if (a > b && b > c) {
                direction = "DECREASING";
                message = "Your " + test + " has decreased across the last 3 uploaded reports. Consider discussing this trend with a healthcare professional.";
            } else {
                direction = "STABLE";
                message = "No consistent upward or downward trend was detected in the last 3 reports.";
            }
        }
        return new TrendResponse(test, last == null ? null : last.getUnit(),
                last == null ? null : last.getRefLow(), last == null ? null : last.getRefHigh(), points, direction, message);
    }

    /** Latest report vs the most recent earlier value of each test. */
    public List<ComparisonRow> compare(User actor, Long patientId) {
        patientService.getAccessible(patientId, actor);
        return buildComparison(patientId);
    }

    public DashboardResponse dashboard(User actor, Long patientId) {
        patientService.getAccessible(patientId, actor);
        List<Report> done = reports.findByPatientIdAndStatusOrderByReportDateAscIdAsc(patientId, ReportStatus.DONE);
        if (done.isEmpty()) return new DashboardResponse(null, null, 0, 0, 0, 0, 0, 0, List.of());
        Report latest = done.get(done.size() - 1);
        int g = 0, y = 0, r = 0, grey = 0;
        List<LabResult> rows = labResults.findByReportIdOrderById(latest.getId());
        for (LabResult x : rows) {
            switch (x.getSafetyLevel()) {
                case "GREEN" -> g++;
                case "YELLOW" -> y++;
                case "RED" -> r++;
                default -> grey++;
            }
        }
        return new DashboardResponse(latest.getId(), latest.getReportDate(), done.size(), rows.size(), g, y, r, grey,
                buildComparison(patientId));
    }

    private List<ComparisonRow> buildComparison(Long patientId) {
        List<Report> done = reports.findByPatientIdAndStatusOrderByReportDateAscIdAsc(patientId, ReportStatus.DONE);
        if (done.isEmpty()) return List.of();
        Report latest = done.get(done.size() - 1);

        Map<String, LabResult> previous = new HashMap<>();
        for (int i = done.size() - 2; i >= 0; i--) {                       // newest -> oldest, first hit wins
            for (LabResult r : labResults.findByReportIdOrderById(done.get(i).getId()))
                previous.putIfAbsent(r.getTestName().toLowerCase(), r);
        }

        List<ComparisonRow> out = new ArrayList<>();
        for (LabResult cur : labResults.findByReportIdOrderById(latest.getId())) {
            LabResult prev = previous.get(cur.getTestName().toLowerCase());
            String dir = "NEW";
            if (prev != null) {
                double diff = cur.getValue() - prev.getValue();
                dir = Math.abs(diff) < 1e-9 ? "SAME" : diff > 0 ? "UP" : "DOWN";
            }
            out.add(new ComparisonRow(cur.getTestName(), cur.getUnit(),
                    prev == null ? null : prev.getValue(), prev == null ? null : prev.getReport().getReportDate(),
                    cur.getValue(), dir, cur.getFlag().name()));
        }
        return out;
    }
}
