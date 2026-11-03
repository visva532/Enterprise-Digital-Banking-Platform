package com.fincore.loan.entity;

import com.fincore.loan.enums.LoanStatus;
import com.fincore.loan.enums.LoanType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loan_applications")
@Getter @Setter @NoArgsConstructor
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 100)
    private String applicantName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private LoanType loanType;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private int tenureMonths;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal monthlyIncome;

    @Column(nullable = false, length = 300)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private LoanStatus status = LoanStatus.PENDING;

    @Column(length = 150)
    private String reviewedBy;

    @Column(length = 300)
    private String reviewRemarks;

    private Instant reviewedAt;

    @Version
    private Long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}