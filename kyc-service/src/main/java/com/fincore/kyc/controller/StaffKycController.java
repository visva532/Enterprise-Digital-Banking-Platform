package com.fincore.kyc.controller;

import com.fincore.kyc.enums.KycEnums.ApplicationStatus;
import com.fincore.kyc.enums.KycEnums.DocumentKind;
import com.fincore.kyc.security.AuthUser;
import com.fincore.kyc.service.FileStorageService.DocumentFile;
import com.fincore.kyc.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.fincore.kyc.dto.KycDtos.*;

@RestController
@RequiredArgsConstructor
public class StaffKycController {

    private final ReviewService reviewService;

    // ---------- TELLER, MANAGER, ADMIN (read only, Aadhaar and PAN masked) ----------
    @GetMapping("/api/staff/kyc/applications")
    public List<StaffApplicationView> list(@RequestParam(defaultValue = "") String q,
                                           @RequestParam(required = false) ApplicationStatus status) {
        return reviewService.list(q, status);
    }

    // ---------- MANAGER, ADMIN ----------
    @PutMapping("/api/manager/kyc/applications/{id}/approve")
    public StaffApplicationView approve(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                        @Valid @RequestBody(required = false) ReviewRequest req) {
        return reviewService.approve(id, actor, req == null ? null : req.remarks());
    }

    @PutMapping("/api/manager/kyc/applications/{id}/reject")
    public StaffApplicationView reject(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                       @Valid @RequestBody ReviewRequest req) {
        return reviewService.reject(id, actor, req.remarks());
    }

    @GetMapping("/api/manager/kyc/applications/{id}/audit")
    public List<AuditView> audit(@PathVariable String id) {
        return reviewService.audit(id);
    }

    @GetMapping("/api/manager/kyc/applications/{id}/documents/{kind}")
    public ResponseEntity<byte[]> document(@AuthenticationPrincipal AuthUser actor, @PathVariable String id,
                                           @PathVariable DocumentKind kind) {
        DocumentFile file = reviewService.document(id, kind, actor);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(file.bytes());
    }

    @PutMapping("/api/manager/kyc/profiles/{userId}/re-kyc")
    public MessageResponse requestReKyc(@AuthenticationPrincipal AuthUser actor, @PathVariable String userId,
                                        @Valid @RequestBody ReKycRequest req) {
        reviewService.requestReKyc(userId, actor, req.reason());
        return new MessageResponse("Re-KYC requested. The customer has been notified.");
    }
}