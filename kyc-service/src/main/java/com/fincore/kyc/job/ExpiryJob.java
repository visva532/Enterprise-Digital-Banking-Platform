package com.fincore.kyc.job;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.enums.KycEnums.KycStatus;
import com.fincore.kyc.repository.KycApplicationRepository;
import com.fincore.kyc.repository.KycProfileRepository;
import com.fincore.kyc.service.AuditService;
import com.fincore.kyc.service.EmailService;
import com.fincore.kyc.util.AfterCommit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class ExpiryJob {

    private final KycProfileRepository profiles;
    private final KycApplicationRepository applications;
    private final AuditService audit;
    private final EmailService emailService;

    @Value("${app.kyc.reminder-days}")
    private long reminderDays;

    @Scheduled(cron = "0 0 2 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void run() {
        Instant now = Instant.now();

        for (KycProfile profile : profiles.findByStatusAndValidUntilBefore(KycStatus.VERIFIED, now)) {
            profile.setStatus(KycStatus.EXPIRED);
            profile.setCustomerSyncedStatus(null);
            profiles.save(profile);
            audit.log(null, profile.getUserId(), "EXPIRED", "SYSTEM", "SYSTEM", "KYC validity ended");
            String name = nameOf(profile);
            AfterCommit.run(() -> emailService.sendExpired(profile.getEmail(), name));
        }

        Instant horizon = now.plus(reminderDays, ChronoUnit.DAYS);
        for (KycProfile profile : profiles.findByStatusAndValidUntilBetweenAndReminderSentAtIsNull(
                KycStatus.VERIFIED, now, horizon)) {
            profile.setReminderSentAt(now);
            profiles.save(profile);
            long daysLeft = ChronoUnit.DAYS.between(now, profile.getValidUntil());
            audit.log(null, profile.getUserId(), "EXPIRY_REMINDER", "SYSTEM", "SYSTEM", daysLeft + " days left");
            String name = nameOf(profile);
            AfterCommit.run(() -> emailService.sendExpiryReminder(profile.getEmail(), name, profile.getValidUntil(), daysLeft));
        }
    }

    private String nameOf(KycProfile profile) {
        return applications.findFirstByUserIdOrderByCreatedAtDesc(profile.getUserId())
                .map(KycApplication::getFullName).orElse("Customer");
    }
}