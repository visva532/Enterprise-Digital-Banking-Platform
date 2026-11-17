package com.fincore.customer.controller;

import com.fincore.customer.enums.KycStatus;
import com.fincore.customer.service.CustomerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Only other FinCore services can call this (shared key). Customers get 401.
@RestController
@RequestMapping("/internal/customers")
@RequiredArgsConstructor
public class InternalCustomerController {

    public record KycStatusUpdate(@NotNull KycStatus status, String email) {}

    private final CustomerService customerService;

    @PutMapping("/{userId}/kyc-status")
    public ResponseEntity<Void> updateKycStatus(@PathVariable String userId,
                                                @Valid @RequestBody KycStatusUpdate body) {
        customerService.updateKycStatus(userId, body.email(), body.status());
        return ResponseEntity.noContent().build();
    }
}