package com.fincore.kyc.repository;

import com.fincore.kyc.entity.KycAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KycAuditRepository extends JpaRepository<KycAuditLog, Long> {
    List<KycAuditLog> findByApplicationIdOrderByCreatedAtDesc(String applicationId);
}