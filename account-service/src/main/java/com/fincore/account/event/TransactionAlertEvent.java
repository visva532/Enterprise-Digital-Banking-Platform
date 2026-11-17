package com.fincore.account.event;

import java.math.BigDecimal;

public record TransactionAlertEvent(String email, String holderName, boolean credited, BigDecimal amount,
                                    String accountNumber, BigDecimal balanceAfter, String reference,
                                    String counterparty, String note) {

    public TransactionAlertEvent(String email, String holderName, boolean credited, BigDecimal amount,
                                 String accountNumber, BigDecimal balanceAfter, String reference) {
        this(email, holderName, credited, amount, accountNumber, balanceAfter, reference, null, null);
    }
}