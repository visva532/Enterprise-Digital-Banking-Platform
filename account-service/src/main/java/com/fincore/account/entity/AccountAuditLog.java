package com.fincore.account.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "account_audit_log")
@Getter @Setter @NoArgsConstructor
public class AccountAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accountId;

    @Column(nullable = false, length = 20)
    private String action;                // FREEZE, UNFREEZE, BLOCK, UNBLOCK, DEACTIVATE

    @Column(nullable = false)
    private String actorId;

    @Column(nullable = false, length = 150)
    private String actorEmail;

    @Column(nullable = false, length = 20)
    private String actorRole;

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}