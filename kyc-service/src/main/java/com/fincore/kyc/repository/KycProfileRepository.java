package com.fincore.kyc.repository;

import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.enums.KycEnums.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface KycProfileRepository extends JpaRepository<KycProfile, String> {

    Optional<KycProfile> findByUserId(String userId);

    List<KycProfile> findByStatusAndValidUntilBefore(KycStatus status, Instant before);

    List<KycProfile> findByStatusAndValidUntilBetweenAndReminderSentAtIsNull(KycStatus status, Instant from, Instant to);

    @Query("select p from KycProfile p where p.customerSyncedStatus is null or p.customerSyncedStatus <> p.status")
    List<KycProfile> findNeedingSync();
}