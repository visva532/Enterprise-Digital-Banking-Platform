package com.fincore.kyc.controller;

import com.fincore.kyc.security.AuthUser;
import com.fincore.kyc.service.ApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static com.fincore.kyc.dto.KycDtos.*;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
public class KycController {

    private final ApplicationService applicationService;

    @GetMapping("/me")
    public KycStatusResponse me(@AuthenticationPrincipal AuthUser user) {
        return applicationService.status(user);
    }

    @GetMapping("/applications")
    public List<ApplicationView> history(@AuthenticationPrincipal AuthUser user) {
        return applicationService.history(user);
    }

    @PostMapping(value = "/applications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SubmitResponse submit(@AuthenticationPrincipal AuthUser user,
                                 @Valid @RequestPart("data") KycSubmitRequest data,
                                 @RequestPart("idProof") MultipartFile idProof,
                                 @RequestPart("selfie") MultipartFile selfie) {
        return applicationService.submit(user, data, idProof, selfie);
    }

    @PostMapping("/applications/{id}/verify-otp")
    public ApplicationView verifyOtp(@AuthenticationPrincipal AuthUser user, @PathVariable String id,
                                     @Valid @RequestBody OtpRequest req) {
        return applicationService.verifyOtp(user, id, req.otp());
    }

    @PostMapping("/applications/{id}/resend-otp")
    public MessageResponse resendOtp(@AuthenticationPrincipal AuthUser user, @PathVariable String id) {
        return applicationService.resendOtp(user, id);
    }
}