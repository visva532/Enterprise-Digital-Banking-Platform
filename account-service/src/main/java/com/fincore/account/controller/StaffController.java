package com.fincore.account.controller;

import com.fincore.account.enums.AccountStatus;
import com.fincore.account.security.AuthUser;
import com.fincore.account.service.DashboardService;
import com.fincore.account.service.StaffAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.account.dto.StaffDtos.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StaffController {

    private final StaffAccountService staffService;
    private final DashboardService dashboardService;

    // ---------- TELLER, MANAGER, ADMIN (read only) ----------
    @GetMapping("/staff/accounts")
    public List<StaffAccountView> search(@RequestParam(defaultValue = "") String q,
                                         @RequestParam(required = false) AccountStatus status) {
        return staffService.search(q, status);
    }

    @GetMapping("/staff/accounts/{id}")
    public StaffAccountView get(@PathVariable String id) {
        return staffService.get(id);
    }

    @GetMapping("/staff/accounts/{id}/transactions")
    public List<TransactionView> transactions(@PathVariable String id) {
        return staffService.transactions(id);
    }

    // ---------- MANAGER, ADMIN ----------
    @PutMapping("/manager/accounts/{id}/freeze")
    public StaffAccountView freeze(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                   @Valid @RequestBody StatusChangeRequest req) {
        return staffService.freeze(id, actor, req.reason());
    }

    @PutMapping("/manager/accounts/{id}/unfreeze")
    public StaffAccountView unfreeze(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                     @Valid @RequestBody StatusChangeRequest req) {
        return staffService.unfreeze(id, actor, req.reason());
    }

    @GetMapping("/manager/accounts/{id}/audit")
    public List<AuditView> audit(@PathVariable String id) {
        return staffService.audit(id);
    }

    // ---------- ADMIN only ----------
    @PutMapping("/admin/accounts/{id}/block")
    public StaffAccountView block(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                  @Valid @RequestBody StatusChangeRequest req) {
        return staffService.block(id, actor, req.reason());
    }

    @PutMapping("/admin/accounts/{id}/unblock")
    public StaffAccountView unblock(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                    @Valid @RequestBody StatusChangeRequest req) {
        return staffService.unblock(id, actor, req.reason());
    }

    @PutMapping("/admin/accounts/{id}/deactivate")
    public StaffAccountView deactivate(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                       @Valid @RequestBody StatusChangeRequest req) {
        return staffService.deactivate(id, actor, req.reason());
    }

    @GetMapping("/admin/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.overview();
    }

    @PostMapping("/admin/demo/deposit")
    public TransactionView demoDeposit(@AuthenticationPrincipal AuthUser actor,
                                       @Valid @RequestBody DemoDepositRequest req) {
        return dashboardService.demoDeposit(actor, req);
    }
}