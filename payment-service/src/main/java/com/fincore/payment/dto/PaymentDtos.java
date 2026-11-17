package com.fincore.payment.dto;

import com.fincore.payment.entity.Beneficiary;
import com.fincore.payment.entity.Payment;
import com.fincore.payment.enums.PaymentMode;
import com.fincore.payment.enums.PaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record SendMoneyRequest(
            @NotBlank @Pattern(regexp = "^\\d{12}$", message = "Enter the 12-digit account number") String toAccountNumber,
            @NotNull @DecimalMin(value = "1", message = "Minimum amount is 1")
            @Digits(integer = 8, fraction = 2, message = "Enter a valid amount") BigDecimal amount,
            @NotNull PaymentMode mode,
            @Size(max = 100) String remarks,
            @NotBlank @Size(max = 64) String idempotencyKey) {}

    public record PaymentResponse(
            String id, String reference, String fromAccountMasked, String toAccountMasked, String toHolderName,
            BigDecimal amount, PaymentMode mode, String remarks, PaymentStatus status, String failureReason,
            Instant createdAt, Instant completedAt) {

        public static PaymentResponse from(Payment p) {
            return new PaymentResponse(p.getId(), p.getReference(), mask(p.getFromAccountNumber()),
                    mask(p.getToAccountNumber()), p.getToHolderName(), p.getAmount(), p.getMode(), p.getRemarks(),
                    p.getStatus(), p.getFailureReason(), p.getCreatedAt(), p.getCompletedAt());
        }

        private static String mask(String number) {
            return number == null || number.length() < 4 ? "XXXX" : "XXXXXXXX" + number.substring(number.length() - 4);
        }
    }

    public record AddBeneficiaryRequest(
            @NotBlank @Pattern(regexp = "^\\d{12}$", message = "Enter the 12-digit account number") String accountNumber,
            @Size(max = 60) String nickname) {}

    public record BeneficiaryResponse(String id, String accountNumber, String holderName, String nickname, Instant createdAt) {
        public static BeneficiaryResponse from(Beneficiary b) {
            return new BeneficiaryResponse(b.getId(), b.getAccountNumber(), b.getHolderName(), b.getNickname(), b.getCreatedAt());
        }
    }

    public record AccountVerification(String accountNumber, String holderName) {}
}