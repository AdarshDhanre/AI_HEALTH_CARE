package com.medicase.repository;

import com.medicase.entity.AiSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface AiSummaryRepository extends JpaRepository<AiSummary, Long> {
    Optional<AiSummary> findByReportIdAndLanguage(Long reportId, String language);

    @Transactional
    @Modifying
    @Query("delete from AiSummary s where s.report.id = :rid")
    void deleteByReportId(@Param("rid") Long reportId);
}
