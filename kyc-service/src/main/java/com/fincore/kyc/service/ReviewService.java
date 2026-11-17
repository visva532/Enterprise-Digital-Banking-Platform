package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.enums.KycEnums.*;
import com.fincore.kyc.exception.ApiException;
import com.fincore.kyc.repository.KycApplicationRepository;
import com.fincore.kyc.repository.KycAuditRepository;
import com.fincore.kyc.repository.KycProfileRepository;
import com.fincore.kyc.security.AuthUser;
import com.fincore.kyc.util.AfterCommit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.fincore.kyc.dto.KycDtos.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final List<ApplicationStatus> SUBMITTED =
            List.of(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED);

    private final KycApplicationRepository applications;
    private final KycProfileRepository profiles;
    private final KycAuditRepository audits;
    private final DecisionService decisions;
    private final AuditService audit;
    private final FileStorageService storage;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<StaffApplicationView> list(String q, ApplicationStatus status) {
        List<ApplicationStatus> statuses =
                (status == null || status == ApplicationStatus.PENDING_OTP) ? SUBMITTED : List.of(status);
        return applications.search(q == null ? "" : q.trim(), statuses, PageRequest.of(0, 100))
                .stream().map(StaffApplicationView::from).toList();
    }

    @Transactional
    public StaffApplicationView approve(String id, AuthUser actor, String remarks) {
        KycApplication app = reviewable(id);
        decisions.approve(app, actor.email(), actor.role(), remarks);
        return StaffApplicationView.from(app);
    }

    @Transactional
    public StaffApplicationView reject(String id, AuthUser actor, String remarks) {
        if (remarks == null || remarks.trim().length() < 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please give a reason for rejecting (at least 5 characters)");
        }
        KycApplication app = reviewable(id);
        decisions.reject(app, actor.email(), actor.role(), remarks.trim());
        return StaffApplicationView.from(app);
    }

    // Opening a document is itself recorded in the audit trail
    @Transactional
    public FileStorageService.DocumentFile document(String id, DocumentKind kind, AuthUser actor) {
        KycApplication app = find(id);
        String fileName = kind == DocumentKind.SELFIE ? app.getSelfieFile() : app.getIdProofFile();
        String type = kind == DocumentKind.SELFIE ? app.getSelfieType() : app.getIdProofType();
        byte[] bytes = storage.readBytes(app.getId(), fileName);
        audit.log(app.getId(), app.getUserId(), "DOCUMENT_VIEWED", actor.email(), actor.role(), kind.name() + " opened");
        return new FileStorageService.DocumentFile(bytes, type);
    }

    @Transactional(readOnly = true)
    public List<AuditView> audit(String id) {
        find(id);
        return audits.findByApplicationIdOrderByCreatedAtDesc(id).stream().map(AuditView::from).toList();
    }

    // Manager or Admin asks a verified customer to redo KYC: their status becomes EXPIRED
    @Transactional
    public void requestReKyc(String userId, AuthUser actor, String reason) {
        KycProfile profile = profiles.findByUserId(userId)
                .filter(p -> p.getStatus() == KycStatus.VERIFIED)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                        "Re-KYC can only be requested for a customer whose KYC is verified"));
        profile.setStatus(KycStatus.EXPIRED);
        profile.setCustomerSyncedStatus(null);
        profiles.save(profile);

        audit.log(null, userId, "RE_KYC_REQUESTED", actor.email(), actor.role(), reason);
        String name = applications.findFirstByUserIdOrderByCreatedAtDesc(userId)
                .map(KycApplication::getFullName).orElse("Customer");
        AfterCommit.run(() -> emailService.sendReKycRequested(profile.getEmail(), name, reason));
    }

    private KycApplication reviewable(String id) {
        KycApplication app = find(id);
        if (app.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "Only applications under review can be decided");
        }
        return app;
    }

    private KycApplication find(String id) {
        return applications.findById(id)
                .filter(a -> a.getStatus() != ApplicationStatus.PENDING_OTP)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
    }
}