package com.medicase.dto.response;

import java.time.LocalDate;

public record ComparisonRow(String test, String unit, Double previousValue, LocalDate previousDate,
                            Double currentValue, String direction, String flag) {}
