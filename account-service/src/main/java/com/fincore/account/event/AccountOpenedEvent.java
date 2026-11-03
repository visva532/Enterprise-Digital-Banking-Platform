package com.fincore.account.event;

public record AccountOpenedEvent(String email, String holderName, String accountNumber,
                                 String ifsc, String accountType) {}