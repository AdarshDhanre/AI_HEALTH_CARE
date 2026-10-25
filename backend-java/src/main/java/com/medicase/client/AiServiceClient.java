package com.medicase.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.medicase.exception.AiServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/** Bridge from Spring Boot to the FastAPI AI service. Only this class knows the AI service's URLs. */
@Component
public class AiServiceClient {
    private static final ParameterizedTypeReference<Map<String, Object>> MAP = new ParameterizedTypeReference<>() {};

    private final WebClient web;
    private final Duration timeout;

    public AiServiceClient(WebClient aiWebClient, @Value("${medicase.ai.timeout-seconds}") long seconds) {
        this.web = aiWebClient;
        this.timeout = Duration.ofSeconds(seconds);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AiLabResult(@JsonProperty("test_name") String testName,
                              @JsonProperty("raw_name") String rawName,
                              Double value, String unit,
                              @JsonProperty("ref_low") Double refLow,
                              @JsonProperty("ref_high") Double refHigh,
                              @JsonProperty("ref_text") String refText,
                              String flag,
                              @JsonProperty("safety_level") String safetyLevel,
                              Double confidence,
                              @JsonProperty("needs_review") boolean needsReview) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProcessResponse(@JsonProperty("lab_name") String labName,
                                  @JsonProperty("report_date") String reportDate,
                                  @JsonProperty("overall_level") String overallLevel,
                                  List<AiLabResult> results) {}

    public ProcessResponse processReport(Path file) {
        MultipartBodyBuilder b = new MultipartBodyBuilder();
        b.part("file", new FileSystemResource(file));
        try {
            return web.post().uri("/process-report")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(b.build()))
                    .retrieve().bodyToMono(ProcessResponse.class).block(timeout);
        } catch (Exception e) {
            throw new AiServiceException("AI service could not process the report: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> evaluate(Map<String, Object> body) {
        return post("/evaluate", body);
    }

    public Map<String, Object> summary(String language, String dietPref, List<Map<String, Object>> results) {
        return post("/summary", Map.of("language", language, "diet_pref", dietPref == null ? "VEGETARIAN" : dietPref,
                "results", results));
    }

    public Map<String, Object> predictRisk(Map<String, Object> request) {
        return post("/predict-risk", request);
    }

    public Map<String, Object> analyzeSymptomText(Map<String, Object> request) {
        return post("/analyze-symptom-text", request);
    }

    public Map<String, Object> createPatientInterviewSummary(Map<String, Object> request) {
        return post("/patient-interview/summary", request);
    }

    public byte[] getTtsAudio(String text, String lang) {
        try {
            return web.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tts")
                            .queryParam("text", text)
                            .queryParam("lang", lang != null ? lang : "hi")
                            .build())
                    .accept(MediaType.valueOf("audio/mpeg"))
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block(timeout);
        } catch (Exception e) {
            throw new AiServiceException("TTS audio generation failed: " + e.getMessage(), e);
        }
    }
    private Map<String, Object> post(String uri, Object body) {
        try {
            return web.post().uri(uri).bodyValue(body).retrieve().bodyToMono(MAP).block(timeout);
        } catch (Exception e) {
            throw new AiServiceException("AI service call failed (" + uri + "): " + e.getMessage(), e);
        }
    }
}
