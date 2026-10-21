package com.medicase.repository;

import com.medicase.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByDoctorIdOrderByIdDesc(Long doctorId);
    List<Patient> findByUserIdOrderByIdDesc(Long userId);
    Optional<Patient> findFirstByUserId(Long userId);
    boolean existsByPatientUid(String patientUid);
}
