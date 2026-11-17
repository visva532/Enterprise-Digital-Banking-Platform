package com.fincore.kyc.dto;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycAuditLog;
import com.fincore.kyc.enums.KycEnums.*;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;

public final class KycDtos {

    private KycDtos() {}

    // ---------- requests ----------
    public record KycSubmitRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotNull @Past LocalDate dateOfBirth,
            @NotNull Gender gender,
            @NotNull Occupation occupation,
            @NotNull IncomeRange incomeRange,
            @NotBlank @Pattern(regexp = "^[2-9]\\d{11}$", message = "Aadhaar must be a 12-digit number") String aadhaarNumber,
            @NotBlank @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Enter a valid PAN, for example ABCDE1234F") String panNumber,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String mobile,
            @NotBlank @Size(max = 200) String addressLine,
            @NotBlank @Size(max = 80) String city,
            @NotBlank @Size(max = 80) String state,
            @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits") String pincode,
            boolean politicallyExposed,
            @AssertTrue(message = "You must accept the declaration") boolean consent) {}

    public record OtpRequest(
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp) {}

    public record ReviewRequest(@Size(max = 300) String remarks) {}

    public record ReKycRequest(
            @NotBlank @Size(min = 5, max = 300, message = "Please give a reason (5-300 characters)") String reason) {}

    // ---------- customer views ----------
    public record SubmitResponse(String applicationId, String maskedEmail, String message) {}

    public record MessageResponse(String message) {}

    public record ApplicationView(String id, ApplicationType type, ApplicationStatus status,
                                  Instant createdAt, Instant submittedAt, Instant decidedAt, String remarks) {
        public static ApplicationView from(KycApplication a) {
            return new ApplicationView(a.getId(), a.getType(), a.getStatus(), a.getCreatedAt(),
                    a.getSubmittedAt(), a.getDecidedAt(), a.getDecisionRemarks());
        }
    }

    public record KycStatusResponse(String status, Instant verifiedAt, Instant validUntil, Long daysToExpiry,
                                    boolean expiringSoon, boolean canApply, String applyMode,
                                    ApplicationView latestApplication) {}

    // ---------- staff views (Aadhaar and PAN stay masked) ----------
    public record StaffApplicationView(
            String id, String userId, String email, ApplicationType type, ApplicationStatus status,
            String fullName, LocalDate dateOfBirth, Gender gender, Occupation occupation, IncomeRange incomeRange,
            String aadhaarMasked, String panMasked, String mobile,
            String addressLine, String city, String state, String pincode,
            boolean politicallyExposed, Integer faceMatchScore, int riskScore, RiskLevel riskLevel, String riskNotes,
            String decidedBy, String decisionRemarks, Instant decidedAt, Instant submittedAt, Instant createdAt) {

        public static StaffApplicationView from(KycApplication a) {
            return new StaffApplicationView(
                    a.getId(), a.getUserId(), a.getEmail(), a.getType(), a.getStatus(),
                    a.getFullName(), a.getDateOfBirth(), a.getGender(), a.getOccupation(), a.getIncomeRange(),
                    "XXXX XXXX " + a.getAadhaarLast4(), a.getPanMasked(), a.getMobile(),
                    a.getAddressLine(), a.getCity(), a.getState(), a.getPincode(),
                    a.isPoliticallyExposed(), a.getFaceMatchScore(), a.getRiskScore(), a.getRiskLevel(), a.getRiskNotes(),
                    a.getDecidedBy(), a.getDecisionRemarks(), a.getDecidedAt(), a.getSubmittedAt(), a.getCreatedAt());
        }
    }

    public record AuditView(Long id, String action, String actor, String actorRole, String detail, Instant createdAt) {
        public static AuditView from(KycAuditLog e) {
            return new AuditView(e.getId(), e.getAction(), e.getActor(), e.getActorRole(), e.getDetail(), e.getCreatedAt());
        }
    }

    // ---------- internal (other services) ----------
    public record InternalKycStatus(String userId, String status, Instant validUntil) {}
}