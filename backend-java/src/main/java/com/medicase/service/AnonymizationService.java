package com.medicase.service;

import com.medicase.entity.Patient;
import com.medicase.enums.ReportStatus;
import com.medicase.repository.LabResultRepository;
import com.medicase.repository.PatientRepository;
import com.medicase.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

/** Researchers only ever see aggregates / de-identified data - no names, phones, dates of birth or file names. */
@Service
@RequiredArgsConstructor
public class AnonymizationService {
    private final LabResultRepository labResults;
    private final PatientRepository patients;
    private final ReportRepository reports;

    @Value("${medicase.research.min-group-size:3}")
    private int minGroupSize;
    @Value("${medicase.jwt.secret}")
    private String salt;

    public record TestStat(String test, long normal, long low, long high, long critical, long unknown, long total) {}
    public record Analytics(long patients, long reports, int minGroupSize, List<TestStat> tests) {}
    public record AnonymizedPatient(String anonId, String ageBand, String gender, String dietPref) {}

    public Analytics analytics() {
        Map<String, long[]> byTest = new TreeMap<>();      // [normal, low, high, critical, unknown]
        for (Object[] row : labResults.countByTestAndFlag(ReportStatus.DONE)) {
            String test = (String) row[0];
            String flag = row[1].toString();
            long count = ((Number) row[2]).longValue();
            long[] a = byTest.computeIfAbsent(test, k -> new long[5]);
            switch (flag) {
                case "NORMAL" -> a[0] += count;
                case "LOW" -> a[1] += count;
                case "HIGH" -> a[2] += count;
                case "CRITICAL" -> a[3] += count;
                default -> a[4] += count;
            }
        }
        List<TestStat> stats = new ArrayList<>();
        byTest.forEach((t, a) -> {
            long total = Arrays.stream(a).sum();
            if (total >= minGroupSize)                      // small-cell suppression
                stats.add(new TestStat(t, a[0], a[1], a[2], a[3], a[4], total));
        });
        return new Analytics(patients.count(), reports.countByStatus(ReportStatus.DONE), minGroupSize, stats);
    }

    public List<AnonymizedPatient> cohort() {
        return patients.findAll().stream().map(this::anonymize).toList();
    }

    public AnonymizedPatient anonymize(Patient p) {
        return new AnonymizedPatient(hash(p.getPatientUid()), ageBand(p.getDob()), p.getGender(), p.getDietPref());
    }

    static String ageBand(LocalDate dob) {
        if (dob == null) return "unknown";
        int age = Period.between(dob, LocalDate.now()).getYears();
        int lo = (age / 10) * 10;
        return lo + "-" + (lo + 9);
    }

    private String hash(String value) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest((salt + value).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 5; i++) sb.append(String.format("%02x", d[i]));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
