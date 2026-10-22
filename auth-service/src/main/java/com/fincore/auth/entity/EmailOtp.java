package com.fincore.auth.entity;

import com.fincore.auth.enums.OtpPurpose;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "email_otp",
        indexes = @Index(name = "idx_otp_email_purpose", columnList = "email, purpose"))
@Getter @Setter @NoArgsConstructor
public class EmailOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false)
    private String otpHash;          // OTP is stored hashed, never in plain text

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpPurpose purpose;

    @Column(nullable = false)
    private Instant expiresAt;

    private int attempts = 0;

    private boolean used = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}