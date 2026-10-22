package com.medicase.dto.response;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(Long latestReportId, LocalDate latestReportDate, int reportCount, int totalTests,
                                int green, int yellow, int red, int grey, List<ComparisonRow> comparison) {}
