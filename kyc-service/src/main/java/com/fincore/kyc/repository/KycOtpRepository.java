package com.fincore.kyc.repository;

import com.fincore.kyc.entity.KycOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface KycOtpRepository extends JpaRepository<KycOtp, Long> {

    Optional<KycOtp> findTopByApplicationIdAndUsedFalseOrderByCreatedAtDesc(String applicationId);

    @Modifying
    @Query("update KycOtp o set o.used = true where o.applicationId = :applicationId and o.used = false")
    void invalidateAll(@Param("applicationId") String applicationId);
}