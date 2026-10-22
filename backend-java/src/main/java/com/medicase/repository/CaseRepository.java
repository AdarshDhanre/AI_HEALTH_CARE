package com.medicase.repository;

import com.medicase.entity.CaseRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CaseRepository extends JpaRepository<CaseRecord, Long> {
    List<CaseRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
