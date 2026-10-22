package com.medicase.dto.response;

import java.time.LocalDate;
import java.util.List;

public record TrendResponse(String test, String unit, Double refLow, Double refHigh, List<Point> points,
                            String direction, String message) {
    public record Point(LocalDate date, Double value, String flag, Long reportId) {}
}
