package com.fincore.auth.controller;

import com.fincore.auth.security.AuthUser;
import com.fincore.auth.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.auth.dto.AdminDtos.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/employees")
    public List<UserSummary> employees() {
        return adminService.listEmployees();
    }

    @PostMapping("/employees")
    public ResponseEntity<UserSummary> createEmployee(@Valid @RequestBody CreateEmployeeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createEmployee(req));
    }

    @PutMapping("/users/{id}/role")
    public UserSummary changeRole(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                  @Valid @RequestBody ChangeRoleRequest req) {
        return adminService.changeRole(id, req.role(), actor);
    }

    @PutMapping("/users/{id}/enabled")
    public UserSummary setEnabled(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                  @RequestBody SetEnabledRequest req) {
        return adminService.setEnabled(id, req.enabled(), actor);
    }
}