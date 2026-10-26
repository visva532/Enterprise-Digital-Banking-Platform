package com.fincore.account.service;

import com.fincore.account.entity.AccountOtp;
import com.fincore.account.entity.BankAccount;
import com.fincore.account.exception.ApiException;
import com.fincore.account.repository.AccountOtpRepository;
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

    private final AccountOtpRepository otpRepository;
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
    public void generateAndSend(BankAccount account) {
        otpRepository.findTopByAccountIdAndUsedFalseOrderByCreatedAtDesc(account.getId())
                .filter(last -> last.getCreatedAt().plusSeconds(cooldownSeconds).isAfter(Instant.now()))
                .ifPresent(last -> {
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + cooldownSeconds + " seconds before requesting another OTP");
                });

        otpRepository.invalidateAll(account.getId());

        String otp = String.format("%06d", random.nextInt(1_000_000));
        AccountOtp record = new AccountOtp();
        record.setAccountId(account.getId());
        record.setOtpHash(passwordEncoder.encode(otp));
        record.setExpiresAt(Instant.now().plus(expiryMinutes, ChronoUnit.MINUTES));
        otpRepository.save(record);

        emailService.sendOtp(account.getEmail(), otp, expiryMinutes);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void verify(String accountId, String otp) {
        AccountOtp record = otpRepository.findTopByAccountIdAndUsedFalseOrderByCreatedAtDesc(accountId)
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
        record.setUsed(true);
    }
}