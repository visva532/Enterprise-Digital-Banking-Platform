package com.fincore.payment.controller;

import com.fincore.payment.security.AuthUser;
import com.fincore.payment.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.payment.dto.PaymentDtos.*;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @GetMapping
    public List<BeneficiaryResponse> list(@AuthenticationPrincipal AuthUser user) {
        return beneficiaryService.list(user);
    }

    @PostMapping
    public ResponseEntity<BeneficiaryResponse> add(@AuthenticationPrincipal AuthUser user,
                                                   @Valid @RequestBody AddBeneficiaryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(beneficiaryService.add(user, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal AuthUser user, @PathVariable String id) {
        beneficiaryService.remove(user, id);
        return ResponseEntity.noContent().build();
    }
}