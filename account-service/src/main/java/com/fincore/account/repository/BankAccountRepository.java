package com.fincore.account.repository;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BankAccountRepository extends JpaRepository<BankAccount, String> {

    List<BankAccount> findByUserIdAndStatusInOrderByCreatedAtDesc(String userId, Collection<AccountStatus> statuses);

    Optional<BankAccount> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, AccountStatus status);

    Optional<BankAccount> findByIdAndUserId(String id, String userId);

    boolean existsByAccountNumber(String accountNumber);

    boolean existsByAadhaarHashAndStatusAndUserIdNot(String aadhaarHash, AccountStatus status, String userId);

    boolean existsByPanHashAndStatusAndUserIdNot(String panHash, AccountStatus status, String userId);
}