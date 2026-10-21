package com.medicase.entity;

import com.medicase.enums.ResultFlag;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lab_results")
@Getter @Setter @NoArgsConstructor
public class LabResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "report_id")
    private Report report;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(name = "raw_name")
    private String rawName;

    @Column(nullable = false)
    private Double value;

    private String unit;

    @Column(name = "ref_low")
    private Double refLow;

    @Column(name = "ref_high")
    private Double refHigh;

    @Column(name = "ref_text")
    private String refText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResultFlag flag;

    @Column(name = "safety_level", nullable = false)
    private String safetyLevel;

    private Double confidence;

    @Column(name = "needs_review", nullable = false)
    private boolean needsReview;

    @Column(name = "edited_by_doctor", nullable = false)
    private boolean editedByDoctor;
}
