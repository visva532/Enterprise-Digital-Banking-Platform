package com.fincore.auth.service;

import com.fincore.auth.entity.EmailOtp;
import com.fincore.auth.enums.OtpPurpose;
import com.fincore.auth.exception.ApiException;
import com.fincore.auth.repository.EmailOtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final EmailOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes}")
    private long expiryMinutes;

    @Value("${app.otp.max-attempts}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds}")
    private long cooldownSeconds;

    private final SecureRandom random = new SecureRandom();

    @Transactional
    public void generateAndSend(String email, OtpPurpose purpose) {
        // 1. Cooldown: stop OTP spamming
        otpRepository.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .filter(last -> last.getCreatedAt().plusSeconds(cooldownSeconds).isAfter(Instant.now()))
                .ifPresent(last -> {
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + cooldownSeconds + " seconds before requesting another OTP");
                });

        // 2. Old OTPs stop working
        otpRepository.invalidateAll(email, purpose);

        // 3. New 6-digit OTP, stored hashed
        String otp = String.format("%06d", random.nextInt(1_000_000));
        EmailOtp record = new EmailOtp();
        record.setEmail(email);
        record.setPurpose(purpose);
        record.setOtpHash(passwordEncoder.encode(otp));
        record.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        otpRepository.save(record);

        // 4. Send in the background
        emailService.sendOtp(email, otp, purpose, expiryMinutes);
    }

    // noRollbackFor: the "wrong attempt" counter must be saved even though we throw an exception
    @Transactional(noRollbackFor = ApiException.class)
    public void verify(String email, String otp, OtpPurpose purpose) {
        EmailOtp record = otpRepository
                .findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
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
        if (!passwordEncoder.matches(otp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        record.setUsed(true);   // success: one-time use
    }
}