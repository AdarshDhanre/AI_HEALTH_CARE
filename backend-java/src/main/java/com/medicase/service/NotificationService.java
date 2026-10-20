package com.medicase.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/** Placeholder: logs instead of sending. Plug in JavaMailSender / SMS here later. */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Async
    public void reportProcessed(String email, String patientName, Long reportId, boolean critical) {
        if (critical)
            log.warn("[NOTIFY] {}: report {} for {} has CRITICAL values - review urgently", email, reportId, patientName);
        else
            log.info("[NOTIFY] {}: report {} for {} is ready", email, reportId, patientName);
    }
}
