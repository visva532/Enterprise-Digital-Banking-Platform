package com.fincore.account.controller;

import com.fincore.account.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.fincore.account.dto.InternalDtos.*;

// Only other FinCore services can call this (shared key). Customers get 401.
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalController {

    private final TransferService transferService;

    @GetMapping("/accounts/{accountNumber}")
    public ResponseEntity<AccountLookup> lookup(@PathVariable String accountNumber) {
        return transferService.lookup(accountNumber)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/accounts/by-user/{userId}")
    public ResponseEntity<AccountLookup> byUser(@PathVariable String userId) {
        return transferService.byUser(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/transfers")
    public TransferResult transfer(@Valid @RequestBody TransferCommand command) {
        return transferService.transfer(command);
    }
}