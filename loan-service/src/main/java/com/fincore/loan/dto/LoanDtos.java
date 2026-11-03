package com.fincore.loan.dto;

import com.fincore.loan.entity.LoanApplication;
import com.fincore.loan.enums.LoanStatus;
import com.fincore.loan.enums.LoanType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public final class LoanDtos {

    private LoanDtos() {}

    public record ApplyLoanRequest(
            @NotBlank @Size(max = 100) String applicantName,
            @NotNull LoanType loanType,
            @NotNull @DecimalMin(value = "10000", message = "Minimum loan amount is 10,000")
            @DecimalMax(value = "50000000", message = "Maximum loan amount is 5,00,00,000") BigDecimal amount,
            @NotNull @Min(value = 6, message = "Minimum tenure is 6 months")
            @Max(value = 360, message = "Maximum tenure is 360 months") Integer tenureMonths,
            @NotNull @DecimalMin(value = "1000", message = "Enter your monthly income") BigDecimal monthlyIncome,
            @NotBlank @Size(max = 300) String purpose) {}

    public record ReviewRequest(@Size(max = 300) String remarks) {}

    public record LoanResponse(
            String id, String applicantName, String email, LoanType loanType, BigDecimal amount,
            int tenureMonths, BigDecimal monthlyIncome, String purpose, LoanStatus status,
            String reviewedBy, String reviewRemarks, Instant reviewedAt, Instant createdAt) {

        public static LoanResponse from(LoanApplication l) {
            return new LoanResponse(l.getId(), l.getApplicantName(), l.getEmail(), l.getLoanType(), l.getAmount(),
                    l.getTenureMonths(), l.getMonthlyIncome(), l.getPurpose(), l.getStatus(),
                    l.getReviewedBy(), l.getReviewRemarks(), l.getReviewedAt(), l.getCreatedAt());
        }
    }
}