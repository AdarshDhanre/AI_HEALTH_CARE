package com.medicase.repository;

import com.medicase.entity.LabResult;
import com.medicase.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LabResultRepository extends JpaRepository<LabResult, Long> {

    List<LabResult> findByReportIdOrderById(Long reportId);

    @Query("""
           select r from LabResult r join fetch r.report rep
           where rep.patient.id = :pid and rep.status = :status and lower(r.testName) = lower(:test)
           order by rep.reportDate asc, rep.id asc
           """)
    List<LabResult> findHistory(@Param("pid") Long patientId, @Param("test") String testName,
                                @Param("status") ReportStatus status);

    @Query("""
           select distinct r.testName from LabResult r
           where r.report.patient.id = :pid and r.report.status = :status
           order by r.testName
           """)
    List<String> findTestNames(@Param("pid") Long patientId, @Param("status") ReportStatus status);

    /** For researcher analytics - aggregate only, never row-level data. */
    @Query("""
           select r.testName, r.flag, count(r) from LabResult r
           where r.report.status = :status
           group by r.testName, r.flag
           """)
    List<Object[]> countByTestAndFlag(@Param("status") ReportStatus status);
}
