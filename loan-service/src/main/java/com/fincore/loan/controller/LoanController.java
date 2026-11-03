package com.fincore.loan.controller;

import com.fincore.loan.enums.LoanStatus;
import com.fincore.loan.security.AuthUser;
import com.fincore.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.loan.dto.LoanDtos.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // ---------- CUSTOMER ----------
    @PostMapping("/loans")
    public ResponseEntity<LoanResponse> apply(@AuthenticationPrincipal AuthUser user,
                                              @Valid @RequestBody ApplyLoanRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loanService.apply(user, req));
    }

    @GetMapping("/loans/me")
    public List<LoanResponse> mine(@AuthenticationPrincipal AuthUser user) {
        return loanService.mine(user);
    }

    // ---------- MANAGER ----------
    @GetMapping("/manager/loans")
    public List<LoanResponse> list(@RequestParam(required = false) LoanStatus status) {
        return loanService.list(status);
    }

    @PutMapping("/manager/loans/{id}/approve")
    public LoanResponse approve(@AuthenticationPrincipal AuthUser reviewer, @PathVariable String id,
                                @RequestBody(required = false) ReviewRequest req) {
        return loanService.approve(id, reviewer, req == null ? null : req.remarks());
    }

    @PutMapping("/manager/loans/{id}/reject")
    public LoanResponse reject(@AuthenticationPrincipal AuthUser reviewer, @PathVariable String id,
                               @Valid @RequestBody ReviewRequest req) {
        return loanService.reject(id, reviewer, req.remarks());
    }
}