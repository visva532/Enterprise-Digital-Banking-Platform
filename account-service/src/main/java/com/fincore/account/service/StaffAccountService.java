package com.fincore.account.service;

import com.fincore.account.entity.AccountAuditLog;
import com.fincore.account.entity.BankAccount;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.exception.ApiException;
import com.fincore.account.repository.AccountAuditRepository;
import com.fincore.account.repository.BankAccountRepository;
import com.fincore.account.repository.TransactionRepository;
import com.fincore.account.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static com.fincore.account.dto.StaffDtos.*;

@Service
@RequiredArgsConstructor
public class StaffAccountService {

    private static final List<AccountStatus> VISIBLE =
            List.of(AccountStatus.ACTIVE, AccountStatus.FROZEN, AccountStatus.BLOCKED, AccountStatus.CLOSED);

    private final BankAccountRepository accounts;
    private final TransactionRepository transactions;
    private final AccountAuditRepository audits;

    @Transactional(readOnly = true)
    public List<StaffAccountView> search(String q, AccountStatus status) {
        List<AccountStatus> statuses =
                (status == null || status == AccountStatus.PENDING_VERIFICATION) ? VISIBLE : List.of(status);
        String term = q == null ? "" : q.trim();
        return accounts.search(term, statuses, PageRequest.of(0, 100)).stream().map(StaffAccountView::from).toList();
    }

    @Transactional(readOnly = true)
    public StaffAccountView get(String id) {
        return StaffAccountView.from(find(id));
    }

    @Transactional(readOnly = true)
    public List<TransactionView> transactions(String accountId) {
        find(accountId);
        return transactions.findByAccountIdOrderByCreatedAtDesc(accountId, PageRequest.of(0, 200))
                .stream().map(TransactionView::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AuditView> audit(String accountId) {
        find(accountId);
        return audits.findByAccountIdOrderByCreatedAtDesc(accountId).stream().map(AuditView::from).toList();
    }

    // ---- MANAGER and ADMIN ----
    @Transactional
    public StaffAccountView freeze(String id, AuthUser actor, String reason) {
        return change(id, actor, "FREEZE", Set.of(AccountStatus.ACTIVE), AccountStatus.FROZEN, reason);
    }

    @Transactional
    public StaffAccountView unfreeze(String id, AuthUser actor, String reason) {
        return change(id, actor, "UNFREEZE", Set.of(AccountStatus.FROZEN), AccountStatus.ACTIVE, reason);
    }

    // ---- ADMIN only ----
    @Transactional
    public StaffAccountView block(String id, AuthUser actor, String reason) {
        return change(id, actor, "BLOCK", Set.of(AccountStatus.ACTIVE, AccountStatus.FROZEN), AccountStatus.BLOCKED, reason);
    }

    @Transactional
    public StaffAccountView unblock(String id, AuthUser actor, String reason) {
        return change(id, actor, "UNBLOCK", Set.of(AccountStatus.BLOCKED), AccountStatus.ACTIVE, reason);
    }

    @Transactional
    public StaffAccountView deactivate(String id, AuthUser actor, String reason) {
        if (find(id).getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new ApiException(HttpStatus.CONFLICT, "The balance must be zero before an account can be deactivated");
        }
        return change(id, actor, "DEACTIVATE",
                Set.of(AccountStatus.ACTIVE, AccountStatus.FROZEN, AccountStatus.BLOCKED), AccountStatus.CLOSED, reason);
    }

    private StaffAccountView change(String id, AuthUser actor, String action,
                                    Set<AccountStatus> allowedFrom, AccountStatus to, String reason) {
        BankAccount account = find(id);
        if (!allowedFrom.contains(account.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Cannot " + action.toLowerCase() + " an account that is " + account.getStatus());
        }
        account.setStatus(to);
        accounts.save(account);

        AccountAuditLog entry = new AccountAuditLog();
        entry.setAccountId(account.getId());
        entry.setAction(action);
        entry.setActorId(actor.userId());
        entry.setActorEmail(actor.email());
        entry.setActorRole(actor.role());
        entry.setReason(reason.trim());
        audits.save(entry);

        return StaffAccountView.from(account);
    }

    private BankAccount find(String id) {
        return accounts.findById(id)
                .filter(a -> a.getStatus() != AccountStatus.PENDING_VERIFICATION)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
    }
}