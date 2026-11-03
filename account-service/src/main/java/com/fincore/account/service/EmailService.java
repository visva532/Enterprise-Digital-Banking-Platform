package com.fincore.account.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Async
    public void sendOtp(String to, String otp, long expiryMinutes) {
        String intro = "Use this one-time password (OTP) to open your FinCore Nexus account.";
        String body = """
                <p>%s</p>
                <p style="font-size:30px;letter-spacing:8px;font-weight:bold;margin:16px 0">%s</p>
                <p>This OTP is valid for %d minutes. Never share it with anyone.</p>
                <p style="color:#6b7280;font-size:13px">If you did not request this, you can safely ignore this email.</p>
                """.formatted(intro, otp, expiryMinutes);
        String text = intro + "\n\nYour OTP: " + otp + "\nValid for " + expiryMinutes
                + " minutes. Never share it with anyone.";
        send(to, "Confirm your FinCore Nexus account opening", layout("Confirm account opening", body), text);
    }

    @Async
    public void sendAccountOpened(String to, String holderName, String accountNumber, String ifsc, String accountType) {
        String body = """
                <p>Dear %s,</p>
                <p>Your FinCore Nexus %s account is now active.</p>
                <table style="border-collapse:collapse;font-size:14px">
                  <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Account number</td><td><b>%s</b></td></tr>
                  <tr><td style="padding:4px 16px 4px 0;color:#6b7280">IFSC</td><td><b>%s</b></td></tr>
                </table>
                <p>You can now make payments, apply for loans and more.</p>
                """.formatted(HtmlUtils.htmlEscape(holderName), accountType.toLowerCase(), accountNumber, ifsc);
        String text = "Dear " + holderName + ", your FinCore Nexus " + accountType.toLowerCase()
                + " account is now active. Account number: " + accountNumber + ", IFSC: " + ifsc + ".";
        send(to, "Your FinCore Nexus account is active", layout("Account opened", body), text);
    }

    // Ready for when deposit / withdraw / transfer are built
    @Async
    public void sendTransactionAlert(String to, String holderName, boolean credited, BigDecimal amount,
                                     String accountNumber, BigDecimal balanceAfter, String reference) {
        NumberFormat inr = NumberFormat.getCurrencyInstance(Locale.of("en", "IN"));
        String verb = credited ? "credited to" : "debited from";
        String color = credited ? "#15803d" : "#b91c1c";
        String maskedAccount = maskAccount(accountNumber);
        String when = ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH));

        String body = """
                <p>Dear %s,</p>
                <p><span style="font-size:22px;font-weight:bold;color:%s">%s</span> has been %s your account %s.</p>
                <table style="border-collapse:collapse;font-size:14px">
                  <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Date</td><td>%s</td></tr>
                  <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Reference</td><td>%s</td></tr>
                  <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Available balance</td><td>%s</td></tr>
                </table>
                <p style="color:#6b7280;font-size:13px">If you do not recognise this transaction, contact support immediately.</p>
                """.formatted(HtmlUtils.htmlEscape(holderName), color, inr.format(amount), verb, maskedAccount,
                when, HtmlUtils.htmlEscape(reference), inr.format(balanceAfter));

        String text = inr.format(amount) + " has been " + verb + " your account " + maskedAccount
                + " on " + when + ". Reference: " + reference + ". Available balance: " + inr.format(balanceAfter) + ".";

        String subject = inr.format(amount) + (credited ? " credited to " : " debited from ") + "your account " + maskedAccount;
        send(to, subject, layout(credited ? "Money received" : "Money debited", body), text);
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

    private String maskAccount(String number) {
        if (number == null || number.length() < 4) return "XXXX";
        return "XXXXXXXX" + number.substring(number.length() - 4);
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