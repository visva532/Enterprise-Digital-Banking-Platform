package com.fincore.kyc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

@Entity
@Immutable
@Table(name = "kyc_audit_log")
@Getter @Setter @NoArgsConstructor
public class KycAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String applicationId;          // empty for events about the customer's overall KYC

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(nullable = false, length = 150)
    private String actor;

    @Column(nullable = false, length = 20)
    private String actorRole;

    @Column(length = 300)
    private String detail;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}