package com.fincore.account.controller;

import com.fincore.account.security.AuthUser;
import com.fincore.account.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import static com.fincore.account.dto.AccountDtos.*;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    // Does this user have an account? Used by the "open an account" suggestion
    @GetMapping("/me")
    public AccountListResponse myAccounts(@AuthenticationPrincipal AuthUser user) {
        return accountService.myAccounts(user);
    }

    @PostMapping("/open")
    public InitiateResponse open(@AuthenticationPrincipal AuthUser user,
                                 @Valid @RequestBody OpenAccountRequest req) {
        return accountService.initiate(user, req);
    }

    @PostMapping("/open/verify")
    public AccountResponse verify(@AuthenticationPrincipal AuthUser user,
                                  @Valid @RequestBody VerifyOtpRequest req) {
        return accountService.verifyAndOpen(user, req);
    }

    @PostMapping("/open/resend")
    public MessageResponse resend(@AuthenticationPrincipal AuthUser user,
                                  @Valid @RequestBody ResendRequest req) {
        return accountService.resend(user, req.accountId());
    }
}