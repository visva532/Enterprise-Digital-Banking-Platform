package com.fincore.loan.service;

import com.fincore.loan.entity.LoanApplication;
import com.fincore.loan.enums.LoanStatus;
import com.fincore.loan.exception.ApiException;
import com.fincore.loan.repository.LoanRepository;
import com.fincore.loan.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static com.fincore.loan.dto.LoanDtos.*;

@Service
@RequiredArgsConstructor
public class LoanService {

    private static final int MAX_PENDING_PER_CUSTOMER = 3;

    private final LoanRepository repository;

    @Transactional
    public LoanResponse apply(AuthUser user, ApplyLoanRequest req) {
        if (repository.countByUserIdAndStatus(user.userId(), LoanStatus.PENDING) >= MAX_PENDING_PER_CUSTOMER) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "You already have " + MAX_PENDING_PER_CUSTOMER + " pending applications. Please wait for a decision.");
        }
        LoanApplication loan = new LoanApplication();
        loan.setUserId(user.userId());
        loan.setEmail(user.email());
        loan.setApplicantName(req.applicantName().trim());
        loan.setLoanType(req.loanType());
        loan.setAmount(req.amount());
        loan.setTenureMonths(req.tenureMonths());
        loan.setMonthlyIncome(req.monthlyIncome());
        loan.setPurpose(req.purpose().trim());
        return LoanResponse.from(repository.save(loan));
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> mine(AuthUser user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.userId()).stream().map(LoanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> list(LoanStatus status) {
        PageRequest page = PageRequest.of(0, 100);
        List<LoanApplication> loans = status == null
                ? repository.findAllByOrderByCreatedAtDesc(page)
                : repository.findByStatusOrderByCreatedAtDesc(status, page);
        return loans.stream().map(LoanResponse::from).toList();
    }

    @Transactional
    public LoanResponse approve(String id, AuthUser reviewer, String remarks) {
        return review(id, reviewer, LoanStatus.APPROVED, remarks);
    }

    @Transactional
    public LoanResponse reject(String id, AuthUser reviewer, String remarks) {
        if (remarks == null || remarks.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please give a reason for rejecting this application");
        }
        return review(id, reviewer, LoanStatus.REJECTED, remarks);
    }

    private LoanResponse review(String id, AuthUser reviewer, LoanStatus decision, String remarks) {
        LoanApplication loan = repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Loan application not found"));
        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "This application was already " + loan.getStatus());
        }
        loan.setStatus(decision);
        loan.setReviewedBy(reviewer.email());
        loan.setReviewRemarks(remarks == null ? null : remarks.trim());
        loan.setReviewedAt(Instant.now());
        return LoanResponse.from(repository.save(loan));
    }
}