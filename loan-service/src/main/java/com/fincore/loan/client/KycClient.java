package com.fincore.loan.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fincore.loan.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;

@Slf4j
@Component
public class KycClient {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KycStatusView(String userId, String status) {}

    private final RestClient rest;

    public KycClient(@Value("${app.kyc-service.url}") String baseUrl,
                     @Value("${app.internal.api-key}") String apiKey) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.rest = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("X-Internal-Key", apiKey)
                .build();
    }

    public void requireVerified(String userId) {
        String status;
        try {
            KycStatusView view = rest.get().uri("/internal/kyc/" + userId + "/status")
                    .retrieve().body(KycStatusView.class);
            status = view == null ? "NOT_STARTED" : view.status();
        } catch (RestClientException e) {
            log.error("KYC service check failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "KYC service is not reachable right now. Please try again in a moment.");
        }
        if (!"VERIFIED".equals(status)) {
            throw new ApiException(HttpStatus.CONFLICT, status.equals("EXPIRED")
                    ? "Your KYC has expired. Please complete Re-KYC before applying for a loan."
                    : "Please complete your KYC verification before applying for a loan.");
        }
    }
}