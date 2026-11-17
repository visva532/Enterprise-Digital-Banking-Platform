package com.fincore.payment.service;

import com.fincore.payment.client.AccountClient;
import com.fincore.payment.dto.AccountApiDtos.AccountLookup;
import com.fincore.payment.dto.AccountApiDtos.TransferCommand;
import com.fincore.payment.dto.AccountApiDtos.TransferResult;
import com.fincore.payment.entity.Payment;
import com.fincore.payment.enums.PaymentStatus;
import com.fincore.payment.exception.ApiException;
import com.fincore.payment.exception.SettlementUncertainException;
import com.fincore.payment.repository.PaymentRepository;
import com.fincore.payment.security.AuthUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.fincore.payment.dto.PaymentDtos.*;

// Not @Transactional on purpose: the call to account-service must not hold a database connection open.
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final int MAX_ATTEMPTS = 10;

    private final PaymentRepository payments;
    private final AccountClient accountClient;
    private final FraudService fraudService;

    public PaymentResponse send(AuthUser user, SendMoneyRequest req) {
        String idempotencyKey = user.userId() + ":" + req.idempotencyKey();

        // A retry of the same request returns the first result and never moves money twice
        Optional<Payment> existing = payments.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return PaymentResponse.from(existing.get());
        }

        if (req.amount().compareTo(req.mode().getPerTransactionLimit()) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, req.mode() + " payments are limited to "
                    + req.mode().getPerTransactionLimit().toPlainString() + " each");
        }

        AccountLookup from = accountClient.byUser(user.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Open a bank account before sending money"));
        if (!"ACTIVE".equals(from.status())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Your account is " + from.status() + ". You cannot send money right now.");
        }
        AccountLookup to = accountClient.lookup(req.toAccountNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Receiver account not found"));
        if (from.accountNumber().equals(to.accountNumber())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot send money to your own account");
        }
        if (!"ACTIVE".equals(to.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "The receiver's account cannot receive money right now");
        }

        FraudService.Result fraud = fraudService.assess(user.userId(), req.amount());
        if (fraud.blocked()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, fraud.reason());
        }

        Payment payment = new Payment();
        payment.setReference("PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
        payment.setIdempotencyKey(idempotencyKey);
        payment.setUserId(user.userId());
        payment.setFromAccountNumber(from.accountNumber());
        payment.setFromHolderName(from.holderName());
        payment.setToAccountNumber(to.accountNumber());
        payment.setToHolderName(to.holderName());
        payment.setAmount(req.amount());
        payment.setMode(req.mode());
        payment.setRemarks(req.remarks() == null || req.remarks().isBlank() ? null : req.remarks().trim());
        payment.setFraudScore(fraud.score());
        payment = payments.save(payment);                    // saved as PENDING first

        return PaymentResponse.from(settle(payment));
    }

    public List<PaymentResponse> myPayments(AuthUser user) {
        return payments.findByUserIdOrderByCreatedAtDesc(user.userId(), PageRequest.of(0, 100))
                .stream().map(PaymentResponse::from).toList();
    }

    public PaymentResponse myPayment(AuthUser user, String id) {
        return payments.findByIdAndUserId(id, user.userId())
                .map(PaymentResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    public AccountVerification verifyAccount(AuthUser user, String accountNumber) {
        if (!accountNumber.matches("\\d{12}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter the 12-digit account number");
        }
        AccountLookup account = accountClient.lookup(accountNumber)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found with this number"));
        if (!"ACTIVE".equals(account.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "This account cannot receive money right now");
        }
        if (account.userId().equals(user.userId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This is your own account");
        }
        return new AccountVerification(account.accountNumber(), account.holderName());
    }

    // Asks account-service to move the money and records the outcome
    Payment settle(Payment payment) {
        payment.setAttempts(payment.getAttempts() + 1);
        try {
            TransferResult result = accountClient.transfer(new TransferCommand(
                    payment.getReference(), payment.getUserId(), payment.getToAccountNumber(),
                    payment.getAmount(), payment.getRemarks(), payment.getMode().name()));

            if (result.success()) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setFailureCode(null);
                payment.setFailureReason(null);
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureCode(result.code());
                payment.setFailureReason(result.message());
            }
            payment.setCompletedAt(Instant.now());
        } catch (SettlementUncertainException e) {
            // Money may or may not have moved. Stay PENDING and let the retry job settle it safely,
            // because the transfer is idempotent on the payment reference.
            log.warn("Payment {} is uncertain (attempt {}): {}", payment.getReference(), payment.getAttempts(), e.getMessage());
        }
        return payments.save(payment);
    }

    @Scheduled(fixedDelay = 30_000, initialDelay = 30_000)
    public void reconcilePending() {
        Instant cutoff = Instant.now().minusSeconds(30);
        List<Payment> stuck = payments.findByStatusAndCreatedAtBeforeAndAttemptsLessThan(
                PaymentStatus.PENDING, cutoff, MAX_ATTEMPTS);
        for (Payment payment : stuck) {
            try {
                settle(payment);
            } catch (Exception e) {
                log.error("Could not reconcile payment {}", payment.getReference(), e);
            }
        }
    }
}