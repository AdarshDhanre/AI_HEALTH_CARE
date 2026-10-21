package com.medicase.controller;

import com.medicase.client.AyushmanOcrClient;
import com.medicase.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/ayushman")
@RequiredArgsConstructor
public class AyushmanController {

    private final AyushmanOcrClient ocrClient;
    private final AuthService auth;

    @PostMapping(
        value = "/extract",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, Object> extract(@RequestParam("file") MultipartFile file) {
        // Require the same authenticated-user context used by existing APIs.
        auth.currentUser();
        return processExtraction(file);
    }

    @PostMapping(
        value = "/extract-public",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, Object> extractPublic(@RequestParam("file") MultipartFile file) {
        // Public endpoint for Patient Login and Signup card scanning
        return processExtraction(file);
    }

    private Map<String, Object> processExtraction(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Please upload an image.");
        }

        if (file.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(
                HttpStatus.PAYLOAD_TOO_LARGE, "Image must be 5 MB or smaller.");
        }

        String type = file.getContentType();
        if (type == null) {
            throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Image content type is missing.");
        }

        type = type.toLowerCase(Locale.ROOT);
        if (type.equals("image/jpg") || type.equals("image/pjpeg")) {
            type = "image/jpeg";
        }
        if (!type.equals("image/png")
                && !type.equals("image/jpeg")
                && !type.equals("image/webp")) {
            throw new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Upload a PNG, JPEG, or WEBP image.");
        }

        try {
            String filename = file.getOriginalFilename();
            if (filename == null || filename.isBlank()) {
                filename = "card-image";
            }

            return ocrClient.extract(file.getBytes(), filename, type);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Could not read uploaded image.");
        }
    }
}
