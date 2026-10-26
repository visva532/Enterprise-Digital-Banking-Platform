package com.fincore.account.entity;

import com.fincore.account.enums.AccountStatus;
import com.fincore.account.enums.AccountType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bank_accounts")
@Getter @Setter @NoArgsConstructor
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;                       // JWT subject

    @Column(unique = true, length = 20)
    private String accountNumber;                // assigned only after OTP verification

    @Column(length = 11)
    private String ifsc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AccountType accountType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private AccountStatus status = AccountStatus.PENDING_VERIFICATION;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    // Applicant details
    @Column(nullable = false, length = 100) private String fullName;
    @Column(nullable = false, length = 150) private String email;
    @Column(nullable = false, length = 64)  private String aadhaarHash;   // keyed hash, never the number itself
    @Column(nullable = false, length = 4)   private String aadhaarLast4;
    @Column(nullable = false, length = 10)  private String aadhaarMobile;
    @Column(nullable = false, length = 64)  private String panHash;
    @Column(nullable = false, length = 10)  private String panMasked;
    @Column(nullable = false, length = 200) private String addressLine;
    @Column(nullable = false, length = 80)  private String city;
    @Column(nullable = false, length = 80)  private String state;
    @Column(nullable = false, length = 6)   private String pincode;

    @Version
    private Long version;                        // optimistic locking, needed later for payments

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant activatedAt;
}