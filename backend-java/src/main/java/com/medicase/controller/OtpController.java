package com.medicase.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medicase.service.CashfreeAadhaarService;
import com.medicase.service.OtpVerificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

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
            @NotBlank String code,
            @JsonProperty("ref_id") String ref_id,
            @JsonProperty("refId") String refId
    ) {
        public String effectiveRefId() {
            if (refId != null && !refId.isBlank()) return refId.trim();
            if (ref_id != null && !ref_id.isBlank()) return ref_id.trim();
            return "";
        }
    }

    @PostMapping("/send-otp")
    public Map<String, Object> send(@RequestBody SendRequest req) {
        String channel = req.channel().toLowerCase();

        if (!channel.equals("email") && !channel.equals("mobile") && !channel.equals("aadhaar")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Choose email, mobile, or aadhaar verification"
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

        if (channel.equals("aadhaar")) {
            String clean = value.replaceAll("[^0-9]", "");
            if (clean.length() != 12) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Aadhaar number must be exactly 12 digits"
                );
            }

            CashfreeAadhaarService.CashfreeOtpResult result = otp.sendAadhaarOtp(clean);
            if (!result.success()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        result.message() != null ? result.message() : "Failed to generate Aadhaar OTP via Cashfree"
                );
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("status", result.status());
            resp.put("message", result.message());
            resp.put("channel", "aadhaar");
            resp.put("destination", value);
            resp.put("ref_id", result.refId() != null ? result.refId() : "");
            resp.put("refId", result.refId() != null ? result.refId() : "");
            if (result.devOtp() != null && !result.devOtp().isBlank()) {
                resp.put("devOtp", result.devOtp());
            }
            return resp;
        }

        String code = otp.send(value, channel);

        return Map.of(
                "message", "OTP request accepted. In local development, check the backend console.",
                "channel", channel,
                "destination", value,
                "devOtp", code != null ? code : ""
        );
    }

    @PostMapping("/verify-otp")
    public Map<String, Object> verify(@RequestBody VerifyRequest req) {
        String channel = req.channel().toLowerCase();

        if ("aadhaar".equals(channel)) {
            CashfreeAadhaarService.CashfreeVerifyResult res =
                    otp.verifyAadhaarOtp(req.destination(), req.effectiveRefId(), req.code());

            Map<String, Object> resp = new HashMap<>();
            resp.put("verified", res.valid());
            resp.put("status", res.status());
            resp.put("message", res.message());
            resp.put("ref_id", res.refId() != null ? res.refId() : "");

            if (res.valid()) {
                Map<String, Object> demo = new HashMap<>();
                if (res.name() != null) demo.put("name", res.name());
                if (res.dob() != null) demo.put("dob", res.dob());
                if (res.gender() != null) demo.put("gender", res.gender());
                if (res.address() != null) demo.put("address", res.address());
                if (res.careOf() != null) demo.put("care_of", res.careOf());
                resp.put("demographics", demo);
            }
            return resp;
        }

        boolean verified = otp.verify(
                req.destination(),
                channel,
                req.code()
        );

        return Map.of(
                "verified", verified,
                "message", verified
                        ? "Contact verified successfully."
                        : "Invalid or expired OTP."
        );
    }
}