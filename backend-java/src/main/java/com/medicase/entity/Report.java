package com.medicase.entity;

import com.medicase.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "reports")
@Getter @Setter @NoArgsConstructor
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "report_date")
    private LocalDate reportDate;

    @Column(name = "lab_name")
    private String labName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.UPLOADED;

    @Column(nullable = false)
    private boolean reviewed = false;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
