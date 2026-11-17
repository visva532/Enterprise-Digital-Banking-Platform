package com.fincore.kyc.repository;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.enums.KycEnums.ApplicationStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface KycApplicationRepository extends JpaRepository<KycApplication, String> {

    Optional<KycApplication> findByIdAndUserId(String id, String userId);

    Optional<KycApplication> findFirstByUserIdOrderByCreatedAtDesc(String userId);

    Optional<KycApplication> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, ApplicationStatus status);

    List<KycApplication> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndStatus(String userId, ApplicationStatus status);

    boolean existsByAadhaarHashAndStatusAndUserIdNot(String aadhaarHash, ApplicationStatus status, String userId);

    boolean existsByPanHashAndStatusAndUserIdNot(String panHash, ApplicationStatus status, String userId);

    @Query("""
            select a from KycApplication a
            where a.status in :statuses
              and (lower(a.fullName) like lower(concat('%', :q, '%'))
                or lower(a.email) like lower(concat('%', :q, '%'))
                or a.mobile like concat('%', :q, '%'))
            order by a.createdAt desc
            """)
    List<KycApplication> search(@Param("q") String q,
                                @Param("statuses") Collection<ApplicationStatus> statuses,
                                Pageable pageable);
}