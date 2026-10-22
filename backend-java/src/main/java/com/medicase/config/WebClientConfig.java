package com.medicase.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {
    @Bean
    public WebClient aiWebClient(@Value("${medicase.ai.base-url}") String baseUrl,
                                 @Value("${medicase.ai.api-key}") String apiKey,
                                 @Value("${medicase.ai.timeout-seconds}") long timeout) {
        HttpClient http = HttpClient.create().responseTimeout(Duration.ofSeconds(timeout));
        return WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-KEY", apiKey)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .clientConnector(new ReactorClientHttpConnector(http))
                .build();
    }
}
