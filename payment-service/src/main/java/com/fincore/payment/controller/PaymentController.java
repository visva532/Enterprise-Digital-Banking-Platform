package com.fincore.payment.controller;

import com.fincore.payment.security.AuthUser;
import com.fincore.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.payment.dto.PaymentDtos.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public PaymentResponse send(@AuthenticationPrincipal AuthUser user,
                                @Valid @RequestBody SendMoneyRequest req) {
        return paymentService.send(user, req);
    }

    @GetMapping
    public List<PaymentResponse> mine(@AuthenticationPrincipal AuthUser user) {
        return paymentService.myPayments(user);
    }

    @GetMapping("/{id}")
    public PaymentResponse one(@AuthenticationPrincipal AuthUser user, @PathVariable String id) {
        return paymentService.myPayment(user, id);
    }

    // Name check before paying, like UPI
    @GetMapping("/verify-account/{accountNumber}")
    public AccountVerification verify(@AuthenticationPrincipal AuthUser user, @PathVariable String accountNumber) {
        return paymentService.verifyAccount(user, accountNumber);
    }
}