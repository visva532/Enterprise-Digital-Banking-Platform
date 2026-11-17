package com.fincore.payment.enums;

import java.math.BigDecimal;

public enum PaymentMode {
    UPI(new BigDecimal("100000")),
    IMPS(new BigDecimal("500000")),
    NEFT(new BigDecimal("1000000"));

    private final BigDecimal perTransactionLimit;

    PaymentMode(BigDecimal perTransactionLimit) {
        this.perTransactionLimit = perTransactionLimit;
    }

    public BigDecimal getPerTransactionLimit() {
        return perTransactionLimit;
    }
}