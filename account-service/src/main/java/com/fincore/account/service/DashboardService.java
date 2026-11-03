package com.fincore.account.service;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.entity.Transaction;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.enums.TransactionType;
import com.fincore.account.event.TransactionAlertEvent;
import com.fincore.account.exception.ApiException;
import com.fincore.account.repository.BankAccountRepository;
import com.fincore.account.repository.TransactionRepository;
import com.fincore.account.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.fincore.account.dto.StaffDtos.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final List<AccountStatus> HOLDING =
            List.of(AccountStatus.ACTIVE, AccountStatus.FROZEN, AccountStatus.BLOCKED);

    private final BankAccountRepository accounts;
    private final TransactionRepository transactions;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public DashboardResponse overview() {
        LocalDate today = LocalDate.now(IST);
        LocalDate start = today.minusDays(6);
        Instant from = start.atStartOfDay(IST).toInstant();

        Map<LocalDate, BigDecimal[]> flow = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            flow.put(start.plusDays(i), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        long transactionsToday = 0;
        for (Transaction t : transactions.findByCreatedAtGreaterThanEqual(from)) {
            LocalDate day = t.getCreatedAt().atZone(IST).toLocalDate();
            BigDecimal[] bucket = flow.get(day);
            if (bucket == null) continue;
            int index = t.getType() == TransactionType.CREDIT ? 0 : 1;
            bucket[index] = bucket[index].add(t.getAmount());
            if (day.equals(today)) transactionsToday++;
        }
        List<DailyFlow> days = flow.entrySet().stream()
                .map(e -> new DailyFlow(e.getKey(), e.getValue()[0], e.getValue()[1])).toList();
        DailyFlow todayFlow = days.get(days.size() - 1);

        long active = accounts.countByStatus(AccountStatus.ACTIVE);
        long frozen = accounts.countByStatus(AccountStatus.FROZEN);
        long blocked = accounts.countByStatus(AccountStatus.BLOCKED);
        long closed = accounts.countByStatus(AccountStatus.CLOSED);
        BigDecimal deposits = accounts.sumBalance(HOLDING);

        return new DashboardResponse(
                accounts.countCustomers(), active + frozen + blocked + closed,
                active, frozen, blocked, closed,
                deposits == null ? BigDecimal.ZERO : deposits,
                todayFlow.credits(), todayFlow.debits(), transactionsToday,
                days,
                accounts.findTop5ByStatusInOrderByBalanceDesc(HOLDING).stream().map(StaffAccountView::from).toList());
    }

    // DEMO ONLY: lets the Admin put money into an account so the history and dashboard have data.
    // Real deposit / withdraw / transfer will replace this in the payments milestone.
    @Transactional
    public TransactionView demoDeposit(AuthUser actor, DemoDepositRequest req) {
        BankAccount account = accounts.findByAccountNumber(req.accountNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ApiException(HttpStatus.CONFLICT, "Only ACTIVE accounts can receive money");
        }
        BigDecimal newBalance = account.getBalance().add(req.amount());
        account.setBalance(newBalance);
        accounts.save(account);

        Transaction t = new Transaction();
        t.setAccountId(account.getId());
        t.setType(TransactionType.CREDIT);
        t.setAmount(req.amount());
        t.setBalanceAfter(newBalance);
        t.setDescription(req.description() == null || req.description().isBlank() ? "Demo deposit" : req.description().trim());
        t.setReference("TXN" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        t.setCreatedBy(actor.email());
        transactions.save(t);

        events.publishEvent(new TransactionAlertEvent(account.getEmail(), account.getFullName(), true,
                req.amount(), account.getAccountNumber(), newBalance, t.getReference()));
        return TransactionView.from(t);
    }
}