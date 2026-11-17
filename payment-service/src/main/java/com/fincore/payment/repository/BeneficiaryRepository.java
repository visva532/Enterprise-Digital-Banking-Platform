package com.fincore.payment.repository;

import com.fincore.payment.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BeneficiaryRepository extends JpaRepository<Beneficiary, String> {

    List<Beneficiary> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndAccountNumber(String userId, String accountNumber);

    Optional<Beneficiary> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);
}