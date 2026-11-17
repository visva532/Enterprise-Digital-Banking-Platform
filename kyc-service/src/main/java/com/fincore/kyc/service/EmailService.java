package com.fincore.kyc.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kolkata"));

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Async
    public void sendOtp(String to, String otp, long expiryMinutes) {
        String intro = "Use this one-time password (OTP) to confirm your KYC application.";
        String body = "<p>" + intro + "</p>"
                + "<p style=\"font-size:30px;letter-spacing:8px;font-weight:bold;margin:16px 0\">" + otp + "</p>"
                + "<p>This OTP is valid for " + expiryMinutes + " minutes. Never share it with anyone.</p>"
                + "<p style=\"color:#6b7280;font-size:13px\">If you did not request this, you can safely ignore this email.</p>";
        String text = intro + "\n\nYour OTP: " + otp + "\nValid for " + expiryMinutes
                + " minutes. Never share it with anyone.";
        send(to, "Confirm your KYC application", layout("Confirm your KYC application", body), text);
    }

    @Async
    public void sendUnderReview(String to, String name) {
        notice(to, "Your KYC application is under review", "KYC under review", name,
                "We received your KYC application and our team is reviewing it. We will email you as soon as a decision is made.");
    }

    @Async
    public void sendApproved(String to, String name, Instant validUntil, boolean reKyc) {
        notice(to, reKyc ? "Your Re-KYC is approved" : "Your KYC is verified",
                reKyc ? "Re-KYC approved" : "KYC verified", name,
                "Your identity verification is complete. Your KYC is valid until " + DATE.format(validUntil) + ".");
    }

    @Async
    public void sendRejected(String to, String name, String remarks) {
        notice(to, "Your KYC application was not approved", "KYC not approved", name,
                "We could not approve your KYC application. Reason: " + remarks
                        + " You can correct the details and submit again.");
    }

    @Async
    public void sendReKycRequested(String to, String name, String reason) {
        notice(to, "Please update your KYC (Re-KYC)", "Re-KYC required", name,
                "We need you to update your KYC details. Reason: " + reason
                        + " Please sign in and open the KYC page to start Re-KYC.");
    }

    @Async
    public void sendExpiryReminder(String to, String name, Instant validUntil, long daysLeft) {
        notice(to, "Your KYC expires in " + daysLeft + " days", "KYC expiring soon", name,
                "Your KYC expires on " + DATE.format(validUntil)
                        + ". Please sign in and complete Re-KYC to keep using all services.");
    }

    @Async
    public void sendExpired(String to, String name) {
        notice(to, "Your KYC has expired", "KYC expired", name,
                "Your KYC validity has ended. Please sign in and complete Re-KYC to continue using all services.");
    }

    private void notice(String to, String subject, String heading, String name, String message) {
        String body = "<p>Dear " + HtmlUtils.htmlEscape(name) + ",</p><p>" + HtmlUtils.htmlEscape(message) + "</p>";
        send(to, subject, layout(heading, body), "Dear " + name + ", " + message);
    }

    private void send(String to, String subject, String html, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "FinCore Nexus");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            mailSender.send(message);
            log.info("Email sent: {}", subject);
        } catch (Exception e) {
            log.error("Failed to send email '{}' to {}", subject, to, e);
        }
    }

    private String layout(String heading, String bodyHtml) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
                  <div style="background:#0b3d91;color:#ffffff;padding:16px 20px;font-size:18px;font-weight:bold">FinCore Nexus</div>
                  <div style="padding:20px;color:#111827;line-height:1.5">
                    <h2 style="margin:0 0 12px;font-size:18px">%s</h2>
                    %s
                  </div>
                  <div style="padding:12px 20px;background:#f9fafb;color:#6b7280;font-size:12px">
                    This is an automated message from FinCore Nexus. We will never ask for your password or OTP by phone or email.
                  </div>
                </div>
                """.formatted(heading, bodyHtml);
    }
}