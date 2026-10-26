package com.fincore.account.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "account_otp")
@Getter @Setter @NoArgsConstructor
public class AccountOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountId;

    @Column(nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private int attempts = 0;

    private boolean used = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}