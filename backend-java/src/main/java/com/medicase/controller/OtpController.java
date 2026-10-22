package com.medicase.controller;

import com.medicase.service.OtpVerificationService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/verification")
@RequiredArgsConstructor
public class OtpController {

    private final OtpVerificationService otp;

    public record SendRequest(
            @NotBlank String channel,
            @NotBlank String destination
    ) {}

    public record VerifyRequest(
            @NotBlank String channel,
            @NotBlank String destination,
            @NotBlank @Pattern(regexp = "\\d{6}") String code
    ) {}

    @PostMapping("/send-otp")
    public java.util.Map<String, String> send(@RequestBody SendRequest req) {
        String channel = req.channel().toLowerCase();

        if (!channel.equals("email") && !channel.equals("mobile")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Choose email or mobile verification"
            );
        }

        String value = req.destination().trim();

        if (channel.equals("email")
                && !value.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid email address"
            );
        }

        if (channel.equals("mobile")
                && !value.matches("^\\+?[0-9]{10,15}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter a valid mobile number with country code if needed"
            );
        }

        otp.send(value, channel);

        return java.util.Map.of(
                "message",
                "OTP request accepted. Check your inbox/phone; in local development, check the backend console."
        );
    }

    @PostMapping("/verify-otp")
    public java.util.Map<String, Object> verify(@RequestBody VerifyRequest req) {
        boolean verified = otp.verify(
                req.destination(),
                req.channel().toLowerCase(),
                req.code()
        );

        return java.util.Map.of(
                "verified", verified,
                "message", verified
                        ? "Contact verified successfully."
                        : "Invalid or expired OTP."
        );
    }
}