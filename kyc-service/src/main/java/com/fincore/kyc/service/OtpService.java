package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.entity.KycOtp;
import com.fincore.kyc.exception.ApiException;
import com.fincore.kyc.repository.KycOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final KycOtpRepository otpRepository;
    private final EmailService emailService;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();

    @Value("${app.otp.expiry-minutes}")
    private long expiryMinutes;

    @Value("${app.otp.max-attempts}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds}")
    private long cooldownSeconds;

    @Transactional
    public void generateAndSend(KycApplication application) {
        otpRepository.findTopByApplicationIdAndUsedFalseOrderByCreatedAtDesc(application.getId())
                .filter(last -> last.getCreatedAt().plusSeconds(cooldownSeconds).isAfter(Instant.now()))
                .ifPresent(last -> {
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + cooldownSeconds + " seconds before requesting another OTP");
                });

        otpRepository.invalidateAll(application.getId());

        String otp = String.format("%06d", random.nextInt(1_000_000));
        KycOtp record = new KycOtp();
        record.setApplicationId(application.getId());
        record.setOtpHash(encoder.encode(otp));
        record.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        otpRepository.save(record);

        emailService.sendOtp(application.getEmail(), otp, expiryMinutes);
    }

    // noRollbackFor: the wrong-attempt counter must be saved even though we throw
    @Transactional(noRollbackFor = ApiException.class)
    public void verify(String applicationId, String otp) {
        KycOtp record = otpRepository.findTopByApplicationIdAndUsedFalseOrderByCreatedAtDesc(applicationId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "OTP not found or already used. Please request a new one."));

        if (record.getExpiresAt().isBefore(Instant.now())) {
            record.setUsed(true);
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired. Please request a new one.");
        }
        if (record.getAttempts() >= maxAttempts) {
            record.setUsed(true);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many wrong attempts. Please request a new OTP.");
        }
        if (!encoder.matches(otp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        record.setUsed(true);
    }
}