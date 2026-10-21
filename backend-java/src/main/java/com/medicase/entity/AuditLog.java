package com.medicase.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String action;

    private String entity;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(columnDefinition = "text")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
