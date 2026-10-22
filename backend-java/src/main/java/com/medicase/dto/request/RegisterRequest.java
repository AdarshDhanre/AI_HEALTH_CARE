package com.medicase.dto.request;

import com.medicase.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(@NotBlank @Email String email,
                              @NotBlank @Size(min = 8, max = 100) String password,
                              @NotBlank String fullName,
                              @NotNull Role role,
                              String language) {}
