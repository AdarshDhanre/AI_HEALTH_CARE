package com.medicase.controller;

import com.medicase.dto.request.LoginRequest;
import com.medicase.dto.request.RegisterRequest;
import com.medicase.dto.response.AuthResponse;
import com.medicase.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/aadhaar-otp-login")
    public AuthResponse aadhaarOtpLogin(@Valid @RequestBody com.medicase.dto.request.AadhaarLoginRequest req) {
        return auth.loginWithAadhaarOtp(req);
    }
}
