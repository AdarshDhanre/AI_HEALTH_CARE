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
@Table(name = "ai_summaries")
@Getter @Setter @NoArgsConstructor
public class AiSummary {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false) @JoinColumn(name = "report_id")
    private Report report;

    @Column(nullable = false)
    private String language;

    @Column(name = "summary_text", columnDefinition = "text")
    private String summaryText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "guidance_json", columnDefinition = "jsonb")
    private Map<String, Object> guidanceJson;

    @Column(name = "overall_level")
    private String overallLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
