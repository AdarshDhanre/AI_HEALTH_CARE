package com.medicase.dto.response;

import com.medicase.entity.User;

import java.time.Instant;

public record UserResponse(Long id, String email, String fullName, String role, String language, boolean active, Instant createdAt) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole().name(), u.getLanguage(), u.isActive(), u.getCreatedAt());
    }
}
