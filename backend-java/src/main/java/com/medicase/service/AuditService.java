package com.medicase.service;

import com.medicase.entity.AuditLog;
import com.medicase.entity.User;
import com.medicase.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private final AuditLogRepository repo;

    /** Never throws - an audit failure must not break the user's request. */
    public void log(User actor, String action, String entity, Long entityId, String details) {
        try {
            AuditLog a = new AuditLog();
            a.setUserId(actor == null ? null : actor.getId());
            a.setAction(action);
            a.setEntity(entity);
            a.setEntityId(entityId);
            a.setDetails(details);
            repo.save(a);
        } catch (Exception e) {
            log.warn("Audit write failed: {}", e.getMessage());
        }
    }
}
