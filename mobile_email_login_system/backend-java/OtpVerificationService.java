package com.medicase.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;\nimport org.springframework.core.env.Environment;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-lived OTP verification. Email delivery uses Spring Mail when configured.
 * In local development only, OTPs are logged to the backend console. Configure
 * SMTP before deploying. SMS delivery requires an SMS provider integration.
 */
@Service
public class OtpVerificationService {
    private static final Logger log = LoggerFactory.getLogger(OtpVerificationService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private final ObjectProvider<JavaMailSender> mailSender;\n    private final Environment environment;
    private final Map<String, Entry> pending = new ConcurrentHashMap<>();

    public OtpVerificationService(ObjectProvider<JavaMailSender> mailSender) {
        this.mailSender = mailSender;
    }

    public void send(String destination, String channel) {
        String normalized = destination.trim().toLowerCase(Locale.ROOT);
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        pending.put(key(normalized, channel), new Entry(code, Instant.now().plusSeconds(300), 0));
        if ("email".equals(channel) && environment.getProperty("spring.mail.host") != null && !environment.getProperty("spring.mail.host").isBlank() && mailSender.getIfAvailable() != null) {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destination.trim());
            message.setSubject("MediCase-AI verification code");
            message.setText("Your MediCase-AI verification code is " + code + ". It expires in 5 minutes. Do not share this code.");
            mailSender.getObject().send(message);
        } else {
            // Development fallback only; never expose this code through the API response.
            log.warn("[DEV OTP] channel={}, destination={}, code={}. Configure delivery before production.", channel, destination, code);
        }
    }

    public boolean verify(String destination, String channel, String code) {
        String k = key(destination.trim().toLowerCase(Locale.ROOT), channel);
        Entry entry = pending.get(k);
        if (entry == null || Instant.now().isAfter(entry.expiresAt()) || entry.attempts() >= 5) {
            pending.remove(k); return false;
        }
        if (entry.code().equals(code == null ? "" : code.trim())) {
            pending.remove(k); return true;
        }
        pending.put(k, new Entry(entry.code(), entry.expiresAt(), entry.attempts() + 1));
        return false;
    }

    private String key(String destination, String channel) { return channel + ":" + destination; }
    private record Entry(String code, Instant expiresAt, int attempts) {}
}
