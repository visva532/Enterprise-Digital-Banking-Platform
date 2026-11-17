package com.fincore.payment.service;

import com.fincore.payment.enums.PaymentStatus;
import com.fincore.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudService {

    public record Result(boolean blocked, String reason, int score) {}

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final int MAX_PAYMENTS_PER_MINUTE = 5;
    private static final BigDecimal DAILY_LIMIT = new BigDecimal("200000");
    private static final BigDecimal HIGH_VALUE = new BigDecimal("50000");

    private final PaymentRepository payments;

    // Simple demo rules: speed limit, daily limit, and a risk score
    public Result assess(String userId, BigDecimal amount) {
        long lastMinute = payments.countByUserIdAndCreatedAtAfter(userId, Instant.now().minusSeconds(60));
        if (lastMinute >= MAX_PAYMENTS_PER_MINUTE) {
            log.warn("Fraud rule: too many payments in a minute for user {}", userId);
            return new Result(true, "Too many payments in a short time. Please wait a minute and try again.", 90);
        }

        Instant startOfDay = LocalDate.now(IST).atStartOfDay(IST).toInstant();
        BigDecimal today = payments.sumAmountSince(userId,
                List.of(PaymentStatus.PENDING, PaymentStatus.COMPLETED), startOfDay);
        if (today == null) today = BigDecimal.ZERO;
        if (today.add(amount).compareTo(DAILY_LIMIT) > 0) {
            log.warn("Fraud rule: daily limit hit by user {}", userId);
            return new Result(true, "Daily transfer limit of 2,00,000 exceeded. Please try again tomorrow.", 80);
        }

        int score = 5;
        if (amount.compareTo(HIGH_VALUE) >= 0) score += 40;
        if (lastMinute >= 3) score += 25;
        return new Result(false, null, score);
    }
}