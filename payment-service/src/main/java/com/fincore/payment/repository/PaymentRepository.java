package com.fincore.payment.repository;

import com.fincore.payment.entity.Payment;
import com.fincore.payment.enums.PaymentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByIdAndUserId(String id, String userId);

    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndCreatedAtAfter(String userId, Instant since);

    List<Payment> findByStatusAndCreatedAtBeforeAndAttemptsLessThan(PaymentStatus status, Instant before, int attempts);

    @Query("select sum(p.amount) from Payment p where p.userId = :userId and p.status in :statuses and p.createdAt >= :since")
    BigDecimal sumAmountSince(@Param("userId") String userId,
                              @Param("statuses") Collection<PaymentStatus> statuses,
                              @Param("since") Instant since);
}