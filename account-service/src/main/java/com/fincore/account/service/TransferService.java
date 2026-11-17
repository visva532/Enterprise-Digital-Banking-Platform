package com.fincore.account.service;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.entity.Transaction;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.enums.TransactionType;
import com.fincore.account.event.TransactionAlertEvent;
import com.fincore.account.repository.BankAccountRepository;
import com.fincore.account.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.fincore.account.dto.InternalDtos.*;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final List<AccountStatus> OPEN =
            List.of(AccountStatus.ACTIVE, AccountStatus.FROZEN, AccountStatus.BLOCKED);

    private final BankAccountRepository accounts;
    private final TransactionRepository transactions;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public Optional<AccountLookup> lookup(String accountNumber) {
        return accounts.findByAccountNumber(accountNumber)
                .filter(a -> a.getStatus() != AccountStatus.PENDING_VERIFICATION)
                .map(this::toLookup);
    }

    @Transactional(readOnly = true)
    public Optional<AccountLookup> byUser(String userId) {
        return accounts.findByUserIdAndStatusInOrderByCreatedAtDesc(userId, OPEN).stream().findFirst().map(this::toLookup);
    }

    // Debit the sender and credit the receiver in ONE transaction: both happen, or neither does.
    // Business problems (not enough money, frozen account...) are returned as a failed result, not thrown.
    @Transactional
    public TransferResult transfer(TransferCommand cmd) {
        // Idempotency: if this payment reference was already processed, report success again
        if (transactions.existsByReference(cmd.reference() + "-D")) {
            return TransferResult.ok(cmd.reference(), null, null, cmd.toAccountNumber(), null);
        }

        BigDecimal amount = cmd.amount().setScale(2, RoundingMode.HALF_UP);
        if (amount.signum() <= 0) {
            return TransferResult.failed("INVALID_AMOUNT", "Amount must be greater than zero");
        }

        List<String> mine = accounts.findAccountNumbersByUser(cmd.userId(), OPEN);
        if (mine.isEmpty()) {
            return TransferResult.failed("NO_ACCOUNT", "Open a bank account before sending money");
        }
        String fromNumber = mine.get(0);
        String toNumber = cmd.toAccountNumber();
        if (fromNumber.equals(toNumber)) {
            return TransferResult.failed("SAME_ACCOUNT", "You cannot send money to your own account");
        }

        // Lock both rows in a fixed order, so two opposite payments can never deadlock
        Map<String, BankAccount> locked = new HashMap<>();
        for (String number : Stream.of(fromNumber, toNumber).sorted().toList()) {
            accounts.findByAccountNumberForUpdate(number).ifPresent(a -> locked.put(number, a));
        }
        BankAccount from = locked.get(fromNumber);
        BankAccount to = locked.get(toNumber);

        if (to == null || to.getStatus() == AccountStatus.PENDING_VERIFICATION) {
            return TransferResult.failed("RECEIVER_NOT_FOUND", "Receiver account not found");
        }
        if (from.getStatus() != AccountStatus.ACTIVE) {
            return TransferResult.failed("SENDER_" + from.getStatus().name(),
                    "Your account is " + from.getStatus() + ". Please contact your branch.");
        }
        if (to.getStatus() != AccountStatus.ACTIVE) {
            return TransferResult.failed("RECEIVER_INACTIVE", "The receiver's account cannot receive money right now");
        }
        if (from.getBalance().compareTo(amount) < 0) {
            return TransferResult.failed("INSUFFICIENT_FUNDS", "Insufficient balance");
        }

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));
        accounts.save(from);
        accounts.save(to);

        String remarks = cmd.remarks() == null ? "" : cmd.remarks().trim();
        String note = cmd.mode() + " transfer" + (remarks.isEmpty() ? "" : " - " + remarks);

        transactions.save(leg(from, to, TransactionType.DEBIT, amount, cmd.reference() + "-D", note, from.getEmail()));
        transactions.save(leg(to, from, TransactionType.CREDIT, amount, cmd.reference() + "-C", note, from.getEmail()));

        // Sent only after the transaction commits: one email to each person
        events.publishEvent(new TransactionAlertEvent(from.getEmail(), from.getFullName(), false, amount,
                from.getAccountNumber(), from.getBalance(), cmd.reference(), to.getFullName(), remarks));
        events.publishEvent(new TransactionAlertEvent(to.getEmail(), to.getFullName(), true, amount,
                to.getAccountNumber(), to.getBalance(), cmd.reference(), from.getFullName(), remarks));

        return TransferResult.ok(cmd.reference(), from.getAccountNumber(), from.getFullName(),
                to.getAccountNumber(), to.getFullName());
    }

    private Transaction leg(BankAccount owner, BankAccount other, TransactionType type, BigDecimal amount,
                            String reference, String note, String createdBy) {
        Transaction t = new Transaction();
        t.setAccountId(owner.getId());
        t.setType(type);
        t.setAmount(amount);
        t.setBalanceAfter(owner.getBalance());
        t.setDescription(note);
        t.setReference(reference);
        t.setCreatedBy(createdBy);
        t.setCounterpartyName(other.getFullName());
        t.setCounterpartyAccount("XXXXXXXX" + other.getAccountNumber().substring(8));
        return t;
    }

    private AccountLookup toLookup(BankAccount a) {
        return new AccountLookup(a.getUserId(), a.getAccountNumber(), a.getFullName(), a.getStatus(), a.getIfsc());
    }
}