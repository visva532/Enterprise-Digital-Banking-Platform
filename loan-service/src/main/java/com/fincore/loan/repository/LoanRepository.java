package com.fincore.loan.repository;

import com.fincore.loan.entity.LoanApplication;
import com.fincore.loan.enums.LoanStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, String> {

    List<LoanApplication> findByUserIdOrderByCreatedAtDesc(String userId);

    List<LoanApplication> findByStatusOrderByCreatedAtDesc(LoanStatus status, Pageable pageable);

    List<LoanApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByUserIdAndStatus(String userId, LoanStatus status);
}