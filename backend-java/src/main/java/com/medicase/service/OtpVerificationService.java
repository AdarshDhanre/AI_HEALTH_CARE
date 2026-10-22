
package com.medicase.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpVerificationService {

    private static final Logger log =
            LoggerFactory.getLogger(OtpVerificationService.class);

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ObjectProvider<JavaMailSender> mailSender;
    private final Environment environment;

    private final Map<String, Entry> pending = new ConcurrentHashMap<>();

    public OtpVerificationService(
            ObjectProvider<JavaMailSender> mailSender,
            Environment environment) {
        this.mailSender = mailSender;
        this.environment = environment;
    }

    public void send(String destination, String channel) {
        String normalized =
                destination.trim().toLowerCase(Locale.ROOT);

        String code = String.format(
                "%06d", RANDOM.nextInt(1_000_000));

        pending.put(
                key(normalized, channel),
                new Entry(code, Instant.now().plusSeconds(300), 0)
        );

        String mailHost = environment.getProperty("spring.mail.host");
        JavaMailSender sender = mailSender.getIfAvailable();

        if ("email".equals(channel)
                && mailHost != null
                && !mailHost.isBlank()
                && sender != null) {

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destination.trim());
            message.setSubject("MediCase-AI verification code");
            message.setText(
                    "Your MediCase-AI verification code is "
                    + code
                    + ". It expires in 5 minutes. Do not share this code."
            );

            sender.send(message);

        } else {
            // Local development only; configure real delivery before production.
            log.warn(
                    "[DEV OTP] channel={}, destination={}, code={}. "
                    + "Configure delivery before production.",
                    channel, destination, code
            );
        }
    }

    public boolean verify(
            String destination, String channel, String code) {

        String normalized =
                destination.trim().toLowerCase(Locale.ROOT);

        String k = key(normalized, channel);
        Entry entry = pending.get(k);

        if (entry == null
                || Instant.now().isAfter(entry.expiresAt())
                || entry.attempts() >= 5) {
            pending.remove(k);
            return false;
        }

        if (entry.code().equals(code == null ? "" : code.trim())) {
            pending.remove(k);
            return true;
        }

        pending.put(
                k,
                new Entry(
                        entry.code(),
                        entry.expiresAt(),
                        entry.attempts() + 1
                )
        );

        return false;
    }

    private String key(String destination, String channel) {
        return channel + ":" + destination;
    }

    private record Entry(
            String code, Instant expiresAt, int attempts) {
    }
}
