package com.fincore.payment.exception;

// Thrown when we cannot tell whether the money moved (timeout, account-service down)
public class SettlementUncertainException extends RuntimeException {
    public SettlementUncertainException(String message) {
        super(message);
    }
}