package com.fincore.account.repository;

import com.fincore.account.entity.AccountOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AccountOtpRepository extends JpaRepository<AccountOtp, Long> {

    Optional<AccountOtp> findTopByAccountIdAndUsedFalseOrderByCreatedAtDesc(String accountId);

    @Modifying
    @Query("update AccountOtp o set o.used = true where o.accountId = :accountId and o.used = false")
    void invalidateAll(@Param("accountId") String accountId);
}