package com.fincore.account.repository;

import com.fincore.account.entity.Transaction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, String> {

    List<Transaction> findByAccountIdOrderByCreatedAtDesc(String accountId, Pageable pageable);

    List<Transaction> findByCreatedAtGreaterThanEqual(Instant from);
}