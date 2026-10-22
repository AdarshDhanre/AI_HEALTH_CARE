package com.medicase.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

@Component
public class AyushmanOcrClient {
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};

    private final WebClient client;
    private final Duration timeout;
    private final String baseUrl;

    public AyushmanOcrClient(
            @Value("${medicase.ayushman.ocr-url:http://127.0.0.1:8001}") String baseUrl,
            @Value("${medicase.ayushman.timeout-seconds:60}") long timeoutSeconds) {
        this.baseUrl = baseUrl;
        this.client = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    public Map<String, Object> extract(byte[] fileBytes, String filename, String contentType) {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        ByteArrayResource resource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return (filename != null && !filename.isBlank()) ? filename : "card-image";
            }
        };

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(contentType);
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        bodyBuilder.part("file", resource).contentType(mediaType);

        try {
            return client.post()
                    .uri("/extract")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(MAP)
                    .block(timeout);
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                e.getStatusCode(),
                "Ayushman OCR service error: " + e.getResponseBodyAsString(),
                e
            );
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Ayushman OCR service is unreachable at " + baseUrl + ". Please ensure the Ayushman OCR service (port 8001) is running.",
                e
            );
        }
    }
}
