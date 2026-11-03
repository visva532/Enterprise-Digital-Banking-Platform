package com.fincore.account.repository;

import com.fincore.account.entity.AccountAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountAuditRepository extends JpaRepository<AccountAuditLog, Long> {
    List<AccountAuditLog> findByAccountIdOrderByCreatedAtDesc(String accountId);
}