package com.medicase.controller;

import com.medicase.client.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TtsController {

    private final AiServiceClient aiClient;

    @GetMapping
    public ResponseEntity<byte[]> speak(
            @RequestParam("text") String text,
            @RequestParam(value = "lang", defaultValue = "hi") String lang) {
        byte[] audio = aiClient.getTtsAudio(text, lang);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .body(audio);
    }
}
