package com.fincore.payment.client;

import com.fincore.payment.dto.AccountApiDtos.AccountLookup;
import com.fincore.payment.dto.AccountApiDtos.TransferCommand;
import com.fincore.payment.dto.AccountApiDtos.TransferResult;
import com.fincore.payment.exception.ApiException;
import com.fincore.payment.exception.SettlementUncertainException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
public class AccountClient {

    private final RestClient rest;

    public AccountClient(@Value("${app.account-service.url}") String baseUrl,
                         @Value("${app.internal.api-key}") String apiKey) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(5));     // never wait forever for another service

        this.rest = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader("X-Internal-Key", apiKey)
                .build();
    }

    public Optional<AccountLookup> lookup(String accountNumber) {
        return get("/internal/accounts/" + accountNumber);
    }

    public Optional<AccountLookup> byUser(String userId) {
        return get("/internal/accounts/by-user/" + userId);
    }

    private Optional<AccountLookup> get(String path) {
        try {
            return Optional.ofNullable(rest.get().uri(path).retrieve().body(AccountLookup.class));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            log.error("Account service lookup failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The account service is not reachable right now. Please try again in a moment.");
        }
    }

    public TransferResult transfer(TransferCommand command) {
        try {
            TransferResult result = rest.post().uri("/internal/transfers").body(command)
                    .retrieve().body(TransferResult.class);
            if (result == null) {
                throw new SettlementUncertainException("Empty answer from the account service");
            }
            return result;
        } catch (HttpClientErrorException e) {
            // 4xx: the request was refused, so no money moved
            log.error("Account service refused transfer {}: {}", command.reference(), e.getStatusCode());
            return TransferResult.failed("REJECTED", "The payment could not be processed. Please try again later.");
        } catch (RestClientException e) {
            // Timeout, connection lost or a 5xx: we cannot know if the money moved
            throw new SettlementUncertainException("Account service did not answer: " + e.getMessage());
        }
    }
}