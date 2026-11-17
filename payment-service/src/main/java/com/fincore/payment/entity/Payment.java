package com.fincore.payment.entity;

import com.fincore.payment.enums.PaymentMode;
import com.fincore.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    // userId + ":" + the client's key. A retry with the same key never creates a second payment.
    @Column(nullable = false, unique = true, length = 120)
    private String idempotencyKey;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 12)
    private String fromAccountNumber;

    @Column(nullable = false, length = 100)
    private String fromHolderName;

    @Column(nullable = false, length = 12)
    private String toAccountNumber;

    @Column(nullable = false, length = 100)
    private String toHolderName;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PaymentMode mode;

    @Column(length = 100)
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 40)
    private String failureCode;

    @Column(length = 200)
    private String failureReason;

    private int fraudScore;

    private int attempts;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant completedAt;
}