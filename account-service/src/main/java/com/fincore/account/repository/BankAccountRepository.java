package com.fincore.account.repository;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.enums.AccountStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, String> {

    List<BankAccount> findByUserIdAndStatusInOrderByCreatedAtDesc(String userId, Collection<AccountStatus> statuses);

    Optional<BankAccount> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, AccountStatus status);

    Optional<BankAccount> findByIdAndUserId(String id, String userId);

    Optional<BankAccount> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    boolean existsByAadhaarHashAndStatusAndUserIdNot(String aadhaarHash, AccountStatus status, String userId);

    boolean existsByPanHashAndStatusAndUserIdNot(String panHash, AccountStatus status, String userId);

    // ---- staff search and dashboard ----
    @Query("""
            select a from BankAccount a
            where a.status in :statuses
              and (lower(a.fullName) like lower(concat('%', :q, '%'))
                or lower(a.email) like lower(concat('%', :q, '%'))
                or a.accountNumber like concat('%', :q, '%')
                or a.aadhaarMobile like concat('%', :q, '%'))
            order by a.createdAt desc
            """)
    List<BankAccount> search(@Param("q") String q, @Param("statuses") Collection<AccountStatus> statuses, Pageable pageable);

    long countByStatus(AccountStatus status);

    @Query("select sum(a.balance) from BankAccount a where a.status in :statuses")
    BigDecimal sumBalance(@Param("statuses") Collection<AccountStatus> statuses);

    @Query("select count(distinct a.userId) from BankAccount a "
            + "where a.status <> com.fincore.account.enums.AccountStatus.PENDING_VERIFICATION")
    long countCustomers();

    List<BankAccount> findTop5ByStatusInOrderByBalanceDesc(Collection<AccountStatus> statuses);
}