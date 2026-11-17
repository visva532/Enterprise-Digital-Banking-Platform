package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.enums.KycEnums.ApplicationStatus;
import com.fincore.kyc.enums.KycEnums.ApplicationType;
import com.fincore.kyc.enums.KycEnums.KycStatus;
import com.fincore.kyc.repository.KycApplicationRepository;
import com.fincore.kyc.repository.KycProfileRepository;
import com.fincore.kyc.util.AfterCommit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

// The single place where an application is approved or rejected (automatically or by a reviewer)
@Service
@RequiredArgsConstructor
public class DecisionService {

    private final KycApplicationRepository applications;
    private final KycProfileRepository profiles;
    private final AuditService audit;
    private final EmailService emailService;

    @Value("${app.kyc.validity-days}")
    private long validityDays;

    @Transactional
    public void approve(KycApplication app, String actor, String role, String remarks) {
        Instant now = Instant.now();
        app.setStatus(ApplicationStatus.APPROVED);
        app.setDecidedBy(actor);
        app.setDecisionRemarks(clean(remarks));
        app.setDecidedAt(now);
        applications.save(app);

        KycProfile profile = profileFor(app);
        Instant validUntil = now.plus(validityDays, ChronoUnit.DAYS);
        profile.setStatus(KycStatus.VERIFIED);
        profile.setVerifiedAt(now);
        profile.setValidUntil(validUntil);
        profile.setRiskLevel(app.getRiskLevel());
        profile.setReminderSentAt(null);
        profile.setCustomerSyncedStatus(null);          // tells the sync job to update customer-service
        profiles.save(profile);

        audit.log(app.getId(), app.getUserId(), "APPROVED", actor, role, remarks == null ? "Approved" : remarks);
        boolean reKyc = app.getType() == ApplicationType.RE_KYC;
        AfterCommit.run(() -> emailService.sendApproved(app.getEmail(), app.getFullName(), validUntil, reKyc));
    }

    @Transactional
    public void reject(KycApplication app, String actor, String role, String remarks) {
        app.setStatus(ApplicationStatus.REJECTED);
        app.setDecidedBy(actor);
        app.setDecisionRemarks(clean(remarks));
        app.setDecidedAt(Instant.now());
        applications.save(app);

        // A rejected first-time application means "REJECTED".
        // A rejected Re-KYC changes nothing: the customer keeps their current status.
        KycProfile profile = profileFor(app);
        if (profile.getStatus() == KycStatus.PENDING) {
            profile.setStatus(KycStatus.REJECTED);
            profile.setCustomerSyncedStatus(null);
            profiles.save(profile);
        }

        audit.log(app.getId(), app.getUserId(), "REJECTED", actor, role, remarks);
        AfterCommit.run(() -> emailService.sendRejected(app.getEmail(), app.getFullName(), remarks));
    }

    private KycProfile profileFor(KycApplication app) {
        return profiles.findByUserId(app.getUserId()).orElseGet(() -> {
            KycProfile created = new KycProfile();
            created.setUserId(app.getUserId());
            created.setEmail(app.getEmail());
            return created;
        });
    }

    private String clean(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }
}