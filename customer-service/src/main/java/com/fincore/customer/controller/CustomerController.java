package com.fincore.customer.controller;

import com.fincore.customer.security.AuthUser;
import com.fincore.customer.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import static com.fincore.customer.dto.CustomerDtos.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/me")
    public CustomerResponse me(@AuthenticationPrincipal AuthUser user) {
        return customerService.getMyProfile(user);
    }

    @PutMapping("/me")
    public CustomerResponse updateMe(@AuthenticationPrincipal AuthUser user,
                                     @Valid @RequestBody UpdateProfileRequest req) {
        return customerService.updateMyProfile(user, req);
    }

    // Staff only (used later by teller screens and other services)
    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasAnyRole('TELLER','MANAGER','ADMIN')")
    public CustomerResponse byUserId(@PathVariable String userId) {
        return customerService.getByUserId(userId);
    }
}