package com.medicase.repository;

import com.medicase.entity.Report;
import com.medicase.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByPatientIdOrderByReportDateDescIdDesc(Long patientId);
    List<Report> findByPatientIdAndStatusOrderByReportDateAscIdAsc(Long patientId, ReportStatus status);
    long countByStatus(ReportStatus status);
}
