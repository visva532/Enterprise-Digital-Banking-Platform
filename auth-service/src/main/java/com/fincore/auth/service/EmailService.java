package com.fincore.auth.service;

import com.fincore.auth.enums.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Async
    public void sendOtp(String to, String otp, OtpPurpose purpose, long expiryMinutes) {
        boolean signup = purpose == OtpPurpose.SIGNUP;
        String subject = signup ? "Verify your FinCore Nexus account" : "Reset your FinCore Nexus password";
        String heading = signup ? "Verify your email" : "Reset your password";
        String intro = signup
                ? "Use this one-time password (OTP) to activate your FinCore Nexus account."
                : "Use this one-time password (OTP) to reset your FinCore Nexus password.";

        String body = """
                <p>%s</p>
                <p style="font-size:30px;letter-spacing:8px;font-weight:bold;margin:16px 0">%s</p>
                <p>This OTP is valid for %d minutes. Never share it with anyone.</p>
                <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
                """.formatted(intro, otp, expiryMinutes);

        String text = intro + "\n\nYour OTP: " + otp + "\nValid for " + expiryMinutes
                + " minutes. Never share it with anyone.\nIf you did not request this, ignore this email.";

        send(to, subject, layout(heading, body), text);
    }
    @Async
    public void sendEmployeeCreated(String to, String name, String role) {
        String safeName = HtmlUtils.htmlEscape(name == null ? "" : name);
        String shownRole = role.substring(0, 1) + role.substring(1).toLowerCase();
        String body = """
                <p>Dear %s,</p>
                <p>An administrator has created a FinCore Nexus <b>%s</b> account for you.</p>
                <p>Sign in with the <b>%s</b> option on the sign-in page. Your administrator will share your temporary password separately. You can change it any time with "Forgot password".</p>
                """.formatted(safeName, role, shownRole);
        String text = "An administrator created a FinCore Nexus " + shownRole + " account for you. "
                + "Sign in with the " + shownRole + " option. Your administrator will share your temporary password separately.";
        send(to, "Your FinCore Nexus employee account", layout("Employee account created", body), text);
    }

    @Async
    public void sendPasswordChanged(String to) {
        String body = """
                <p>The password for your FinCore Nexus account was just changed.</p>
                <p>If this was you, no action is needed. If it was not you, reset your password immediately and contact support.</p>
                """;
        String text = "The password for your FinCore Nexus account was just changed. "
                + "If this was not you, reset your password immediately and contact support.";
        send(to, "Your FinCore Nexus password was changed", layout("Password changed", body), text);
    }

    private void send(String to, String subject, String html, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "FinCore Nexus");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);          // plain-text fallback + HTML version
            mailSender.send(message);
            log.info("Email sent: {}", subject);
        } catch (Exception e) {
            // An email failure must never break signup or sign-in. The user can resend.
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