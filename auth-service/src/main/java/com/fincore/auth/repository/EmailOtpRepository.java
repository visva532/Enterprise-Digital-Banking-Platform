package com.fincore.auth.repository;

import com.fincore.auth.entity.EmailOtp;
import com.fincore.auth.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    Optional<EmailOtp> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);

    @Modifying
    @Query("update EmailOtp o set o.used = true where o.email = :email and o.purpose = :purpose and o.used = false")
    void invalidateAll(@Param("email") String email, @Param("purpose") OtpPurpose purpose);
}