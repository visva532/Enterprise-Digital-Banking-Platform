package com.fincore.kyc.entity;

import com.fincore.kyc.enums.KycEnums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "kyc_applications")
@Getter @Setter @NoArgsConstructor
public class KycApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationType type = ApplicationType.INITIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.PENDING_OTP;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Occupation occupation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncomeRange incomeRange;

    // Aadhaar and PAN are never stored in readable form: masked digits + a keyed hash only
    @Column(nullable = false, length = 64) private String aadhaarHash;
    @Column(nullable = false, length = 4)  private String aadhaarLast4;
    @Column(nullable = false, length = 64) private String panHash;
    @Column(nullable = false, length = 10) private String panMasked;
    @Column(nullable = false, length = 10) private String mobile;

    @Column(nullable = false, length = 200) private String addressLine;
    @Column(nullable = false, length = 80)  private String city;
    @Column(nullable = false, length = 80)  private String state;
    @Column(nullable = false, length = 6)   private String pincode;

    private boolean politicallyExposed;

    @Column(length = 60) private String idProofFile;
    @Column(length = 30) private String idProofType;
    @Column(length = 60) private String selfieFile;
    @Column(length = 30) private String selfieType;

    private Integer faceMatchScore;          // SIMULATED
    private int riskScore;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    @Column(length = 500)
    private String riskNotes;

    @Column(length = 150) private String decidedBy;
    @Column(length = 300) private String decisionRemarks;
    private Instant decidedAt;
    private Instant submittedAt;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}