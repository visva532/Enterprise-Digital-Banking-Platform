package com.fincore.account.dto;

import com.fincore.account.enums.AccountStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public final class InternalDtos {

    private InternalDtos() {}

    public record AccountLookup(String userId, String accountNumber, String holderName,
                                AccountStatus status, String ifsc) {}

    public record TransferCommand(
            @NotBlank @Size(max = 30) String reference,
            @NotBlank String userId,
            @NotBlank @Pattern(regexp = "^\\d{12}$") String toAccountNumber,
            @NotNull @DecimalMin("0.01") BigDecimal amount,
            @Size(max = 100) String remarks,
            @NotBlank @Size(max = 10) String mode) {}

    public record TransferResult(boolean success, String code, String message, String reference,
                                 String fromAccountNumber, String fromHolderName,
                                 String toAccountNumber, String toHolderName) {

        public static TransferResult ok(String reference, String fromNumber, String fromName,
                                        String toNumber, String toName) {
            return new TransferResult(true, "OK", "Transfer completed", reference, fromNumber, fromName, toNumber, toName);
        }

        public static TransferResult failed(String code, String message) {
            return new TransferResult(false, code, message, null, null, null, null, null);
        }
    }
}