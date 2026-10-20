package com.medicase.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtUtil {
    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(@Value("${medicase.jwt.secret}") String secret,
                   @Value("${medicase.jwt.expiration-minutes}") long minutes) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = minutes * 60_000;
    }

    public String generate(String email, String role) {
        Date now = new Date();
        return Jwts.builder().subject(email).claim("role", role)
                .issuedAt(now).expiration(new Date(now.getTime() + expirationMs))
                .signWith(key).compact();
    }

    /** Returns the email if the token is valid and unexpired. */
    public Optional<String> validate(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.ofNullable(c.getSubject());
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
