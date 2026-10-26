package com.fincore.account.dto;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.enums.AccountType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AccountDtos {

    private AccountDtos() {}

    public record OpenAccountRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[2-9]\\d{11}$", message = "Aadhaar must be a 12-digit number") String aadhaarNumber,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter the 10-digit mobile number linked to Aadhaar") String aadhaarMobile,
            @NotBlank @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Enter a valid PAN, for example ABCDE1234F") String panNumber,
            @NotBlank @Size(max = 200) String addressLine,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits") String pincode,
            @NotNull AccountType accountType,
            @AssertTrue(message = "You must accept the declaration") boolean consent) {}

    public record VerifyOtpRequest(
            @NotBlank String accountId,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp) {}

    public record ResendRequest(@NotBlank String accountId) {}

    public record InitiateResponse(String accountId, String maskedEmail, String message) {}

    public record MessageResponse(String message) {}

    public record AccountResponse(
            String id,
            String accountNumber,
            String ifsc,
            AccountType accountType,
            AccountStatus status,
            BigDecimal balance,
            String fullName,
            String email,
            String aadhaarMasked,
            String panMasked,
            String city,
            String state,
            Instant openedAt) {

        public static AccountResponse from(BankAccount a) {
            return new AccountResponse(
                    a.getId(), a.getAccountNumber(), a.getIfsc(), a.getAccountType(), a.getStatus(),
                    a.getBalance(), a.getFullName(), a.getEmail(),
                    "XXXX XXXX " + a.getAadhaarLast4(), a.getPanMasked(),
                    a.getCity(), a.getState(), a.getActivatedAt());
        }
    }

    public record AccountListResponse(boolean hasAccount, List<AccountResponse> accounts) {}
}