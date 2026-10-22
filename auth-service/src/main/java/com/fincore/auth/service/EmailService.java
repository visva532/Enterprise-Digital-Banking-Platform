package com.fincore.auth.service;

import com.fincore.auth.enums.OtpPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Async
    public void sendOtp(String to, String otp, OtpPurpose purpose, long expiryMinutes) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(to);
            msg.setSubject(purpose == OtpPurpose.SIGNUP
                    ? "Verify your FinCore Nexus account"
                    : "Reset your FinCore Nexus password");
            msg.setText("Your one-time password (OTP) is: " + otp + "\n\n"
                    + "It is valid for " + expiryMinutes + " minutes.\n"
                    + "Never share this OTP with anyone. If you did not request it, ignore this email.");
            mailSender.send(msg);
        } catch (Exception e) {
            // Email failure must not crash the flow. The user can click "Resend OTP".
            log.error("Failed to send OTP email to {}", to, e);
        }
    }
}