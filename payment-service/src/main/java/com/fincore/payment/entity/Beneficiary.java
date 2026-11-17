package com.fincore.payment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "beneficiaries")
@Getter @Setter @NoArgsConstructor
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 12)
    private String accountNumber;

    @Column(nullable = false, length = 100)
    private String holderName;

    @Column(length = 60)
    private String nickname;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}