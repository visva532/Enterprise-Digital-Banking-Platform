package com.fincore.payment.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

public final class AccountApiDtos {

    private AccountApiDtos() {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AccountLookup(String userId, String accountNumber, String holderName, String status, String ifsc) {}

    public record TransferCommand(String reference, String userId, String toAccountNumber,
                                  BigDecimal amount, String remarks, String mode) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TransferResult(boolean success, String code, String message, String reference,
                                 String fromAccountNumber, String fromHolderName,
                                 String toAccountNumber, String toHolderName) {

        public static TransferResult failed(String code, String message) {
            return new TransferResult(false, code, message, null, null, null, null, null);
        }
    }
}