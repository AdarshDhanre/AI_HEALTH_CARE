package com.medicase.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "cases")
@Getter @Setter @NoArgsConstructor
public class CaseRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne @JoinColumn(name = "doctor_id")
    private User doctor;

    @Column(name = "chief_complaint", columnDefinition = "text")
    private String chiefComplaint;

    @Column(columnDefinition = "text")
    private String symptoms;

    @Column(name = "medical_history", columnDefinition = "text")
    private String medicalHistory;

    @Column(columnDefinition = "text")
    private String lifestyle;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ayush_details", columnDefinition = "jsonb")
    private Map<String, Object> ayushDetails;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
