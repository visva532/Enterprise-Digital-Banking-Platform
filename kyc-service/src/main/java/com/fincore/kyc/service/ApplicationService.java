package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.enums.KycEnums.*;
import com.fincore.kyc.exception.ApiException;
import com.fincore.kyc.repository.KycApplicationRepository;
import com.fincore.kyc.repository.KycProfileRepository;
import com.fincore.kyc.security.AuthUser;
import com.fincore.kyc.util.AfterCommit;
import com.fincore.kyc.util.PiiHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static com.fincore.kyc.dto.KycDtos.*;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final KycApplicationRepository applications;
    private final KycProfileRepository profiles;
    private final FileStorageService storage;
    private final OtpService otpService;
    private final VerificationService verification;
    private final DecisionService decisions;
    private final AuditService audit;
    private final PiiHasher hasher;
    private final EmailService emailService;

    @Value("${app.kyc.reminder-days}")
    private long reminderDays;

    @Transactional(readOnly = true)
    public KycStatusResponse status(AuthUser user) {
        KycProfile profile = profiles.findByUserId(user.userId()).orElse(null);
        ApplicationView latest = applications.findFirstByUserIdOrderByCreatedAtDesc(user.userId())
                .map(ApplicationView::from).orElse(null);

        KycStatus effective = profile == null ? null : profile.effectiveStatus();
        boolean reKyc = effective == KycStatus.VERIFIED || effective == KycStatus.EXPIRED;
        boolean canApply = latest == null || latest.status() != ApplicationStatus.UNDER_REVIEW;

        Long days = null;
        boolean expiringSoon = false;
        if (effective == KycStatus.VERIFIED && profile.getValidUntil() != null) {
            days = ChronoUnit.DAYS.between(Instant.now(), profile.getValidUntil());
            expiringSoon = days <= reminderDays;
        }
        return new KycStatusResponse(
                effective == null ? "NOT_STARTED" : effective.name(),
                profile == null ? null : profile.getVerifiedAt(),
                profile == null ? null : profile.getValidUntil(),
                days, expiringSoon, canApply, reKyc ? "RE_KYC" : "INITIAL", latest);
    }

    @Transactional(readOnly = true)
    public List<ApplicationView> history(AuthUser user) {
        return applications.findByUserIdOrderByCreatedAtDesc(user.userId()).stream().map(ApplicationView::from).toList();
    }

    @Transactional(readOnly = true)
    public InternalKycStatus internalStatus(String userId) {
        return profiles.findByUserId(userId)
                .map(p -> new InternalKycStatus(userId, p.effectiveStatus().name(), p.getValidUntil()))
                .orElse(new InternalKycStatus(userId, "NOT_STARTED", null));
    }

    // Step 1: validate, store the documents, save as PENDING_OTP, email the OTP
    @Transactional
    public SubmitResponse submit(AuthUser user, KycSubmitRequest req, MultipartFile idProof, MultipartFile selfie) {
        if (applications.existsByUserIdAndStatus(user.userId(), ApplicationStatus.UNDER_REVIEW)) {
            throw new ApiException(HttpStatus.CONFLICT, "Your KYC application is already under review");
        }
        if (Period.between(req.dateOfBirth(), LocalDate.now(IST)).getYears() < 18) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You must be at least 18 years old to complete KYC");
        }

        String aadhaarHash = hasher.hash(req.aadhaarNumber());
        String panHash = hasher.hash(req.panNumber());
        if (applications.existsByAadhaarHashAndStatusAndUserIdNot(aadhaarHash, ApplicationStatus.APPROVED, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This Aadhaar number is already verified for another customer");
        }
        if (applications.existsByPanHashAndStatusAndUserIdNot(panHash, ApplicationStatus.APPROVED, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This PAN is already verified for another customer");
        }

        KycProfile profile = profiles.findByUserId(user.userId()).orElse(null);
        boolean existingCustomer = profile != null
                && (profile.getStatus() == KycStatus.VERIFIED || profile.getStatus() == KycStatus.EXPIRED);

        // Reuse an unfinished application so that abandoned attempts do not pile up
        KycApplication app = applications
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.userId(), ApplicationStatus.PENDING_OTP)
                .orElseGet(KycApplication::new);

        app.setUserId(user.userId());
        app.setEmail(user.email());
        app.setType(existingCustomer ? ApplicationType.RE_KYC : ApplicationType.INITIAL);
        app.setStatus(ApplicationStatus.PENDING_OTP);
        app.setFullName(req.fullName().trim());
        app.setDateOfBirth(req.dateOfBirth());
        app.setGender(req.gender());
        app.setOccupation(req.occupation());
        app.setIncomeRange(req.incomeRange());
        app.setAadhaarHash(aadhaarHash);
        app.setAadhaarLast4(req.aadhaarNumber().substring(8));
        app.setPanHash(panHash);
        app.setPanMasked("XXXXXX" + req.panNumber().substring(6));
        app.setMobile(req.mobile());
        app.setAddressLine(req.addressLine().trim());
        app.setCity(req.city().trim());
        app.setState(req.state().trim());
        app.setPincode(req.pincode());
        app.setPoliticallyExposed(req.politicallyExposed());
        app = applications.save(app);

        FileStorageService.Stored id = storage.save(app.getId(), DocumentKind.ID_PROOF, idProof);
        FileStorageService.Stored face = storage.save(app.getId(), DocumentKind.SELFIE, selfie);
        app.setIdProofFile(id.fileName());
        app.setIdProofType(id.contentType());
        app.setSelfieFile(face.fileName());
        app.setSelfieType(face.contentType());
        applications.save(app);

        if (profile == null) {
            profile = new KycProfile();
            profile.setUserId(user.userId());
            profile.setStatus(KycStatus.PENDING);
        } else if (profile.getStatus() == KycStatus.REJECTED) {
            profile.setStatus(KycStatus.PENDING);
            profile.setCustomerSyncedStatus(null);
        }
        profile.setEmail(user.email());
        profiles.save(profile);

        audit.log(app.getId(), user.userId(), "SUBMITTED", user.email(), "CUSTOMER", app.getType() + " application submitted");
        otpService.generateAndSend(app);

        String masked = maskEmail(user.email());
        return new SubmitResponse(app.getId(), masked, "We sent a 6-digit OTP to " + masked + ". Enter it to finish your submission.");
    }

    // Step 2: check the OTP, run the automated checks, then approve or send for review.
    // noRollbackFor: wrong-attempt counters must be saved even when we throw.
    @Transactional(noRollbackFor = ApiException.class)
    public ApplicationView verifyOtp(AuthUser user, String applicationId, String otp) {
        KycApplication app = applications.findByIdAndUserId(applicationId, user.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        if (app.getStatus() != ApplicationStatus.PENDING_OTP) {
            throw new ApiException(HttpStatus.CONFLICT, "This application is not waiting for an OTP");
        }

        otpService.verify(app.getId(), otp);

        app.setSubmittedAt(Instant.now());
        audit.log(app.getId(), user.userId(), "OTP_VERIFIED", user.email(), "CUSTOMER", "Email verified with OTP");

        VerificationService.Outcome outcome =
                verification.assess(app, storage.readBytes(app.getId(), app.getSelfieFile()));
        app.setFaceMatchScore(outcome.faceMatchScore());
        app.setRiskScore(outcome.riskScore());
        app.setRiskLevel(outcome.level());
        String notes = String.join("; ", outcome.reasons());
        app.setRiskNotes(notes.length() > 500 ? notes.substring(0, 500) : notes);

        if (outcome.autoApprove()) {
            decisions.approve(app, "SYSTEM", "SYSTEM", "Automatic approval: low risk, all checks passed");
        } else {
            app.setStatus(ApplicationStatus.UNDER_REVIEW);
            applications.save(app);
            audit.log(app.getId(), user.userId(), "SENT_FOR_REVIEW", "SYSTEM", "SYSTEM",
                    outcome.level() + " risk (" + outcome.riskScore() + "): " + notes);
            AfterCommit.run(() -> emailService.sendUnderReview(app.getEmail(), app.getFullName()));
        }
        return ApplicationView.from(app);
    }

    @Transactional
    public MessageResponse resendOtp(AuthUser user, String applicationId) {
        KycApplication app = applications.findByIdAndUserId(applicationId, user.userId())
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING_OTP)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        otpService.generateAndSend(app);
        return new MessageResponse("A new OTP has been sent to your email.");
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***" + email.substring(Math.max(at, 0));
        return email.charAt(0) + "***" + email.substring(at);
    }
}