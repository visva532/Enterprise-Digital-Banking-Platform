package com.fincore.account.event;

import com.fincore.account.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAccountOpened(AccountOpenedEvent e) {
        emailService.sendAccountOpened(e.email(), e.holderName(), e.accountNumber(), e.ifsc(), e.accountType());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onTransactionAlert(TransactionAlertEvent e) {
        emailService.sendTransactionAlert(e.email(), e.holderName(), e.credited(), e.amount(),
                e.accountNumber(), e.balanceAfter(), e.reference());
    }
}