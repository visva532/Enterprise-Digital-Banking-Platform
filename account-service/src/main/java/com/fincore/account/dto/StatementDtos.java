package com.fincore.account.dto;

import com.fincore.account.entity.Transaction;
import com.fincore.account.enums.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public final class StatementDtos {

    private StatementDtos() {}

    public record StatementEntry(
            String id, TransactionType type, BigDecimal amount, BigDecimal balanceAfter,
            String description, String reference, String counterpartyName, String counterpartyAccount,
            Instant createdAt) {

        public static StatementEntry from(Transaction t) {
            return new StatementEntry(t.getId(), t.getType(), t.getAmount(), t.getBalanceAfter(),
                    t.getDescription(), t.getReference(), t.getCounterpartyName(), t.getCounterpartyAccount(),
                    t.getCreatedAt());
        }
    }
}