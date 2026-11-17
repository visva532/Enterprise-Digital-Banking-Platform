package com.fincore.kyc.client;

import com.fincore.kyc.enums.KycEnums.KycStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;

@Slf4j
@Component
public class CustomerClient {

    public record StatusUpdate(String status, String email) {}

    private final RestClient rest;

    public CustomerClient(@Value("${app.customer-service.url}") String baseUrl,
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

    public boolean updateKycStatus(String userId, String email, KycStatus status) {
        try {
            rest.put().uri("/internal/customers/" + userId + "/kyc-status")
                    .body(new StatusUpdate(status.name(), email))
                    .retrieve().toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            log.warn("Could not update customer-service for {}: {}", userId, e.getMessage());
            return false;
        }
    }
}