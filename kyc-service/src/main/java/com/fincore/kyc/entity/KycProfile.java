package com.fincore.kyc.entity;

import com.fincore.kyc.enums.KycEnums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "kyc_profiles")
@Getter @Setter @NoArgsConstructor
public class KycProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String userId;

    @Column(nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status = KycStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private Instant verifiedAt;

    private Instant validUntil;

    private Instant reminderSentAt;

    // The last status that was pushed to customer-service. A different value means a sync is pending.
    @Enumerated(EnumType.STRING)
    private KycStatus customerSyncedStatus;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // VERIFIED turns into EXPIRED the moment the validity date passes, even before the daily job runs
    public KycStatus effectiveStatus() {
        if (status == KycStatus.VERIFIED && validUntil != null && validUntil.isBefore(Instant.now())) {
            return KycStatus.EXPIRED;
        }
        return status;
    }
}