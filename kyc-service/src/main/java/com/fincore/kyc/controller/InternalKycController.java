package com.fincore.kyc.controller;

import com.fincore.kyc.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.fincore.kyc.dto.KycDtos.InternalKycStatus;

// Only other FinCore services can call this (shared key)
@RestController
@RequestMapping("/internal/kyc")
@RequiredArgsConstructor
public class InternalKycController {

    private final ApplicationService applicationService;

    @GetMapping("/{userId}/status")
    public InternalKycStatus status(@PathVariable String userId) {
        return applicationService.internalStatus(userId);
    }
}