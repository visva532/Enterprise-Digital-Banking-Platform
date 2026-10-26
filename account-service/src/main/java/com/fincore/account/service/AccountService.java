package com.fincore.account.service;

import com.fincore.account.entity.BankAccount;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.exception.ApiException;
import com.fincore.account.repository.BankAccountRepository;
import com.fincore.account.security.AuthUser;
import com.fincore.account.util.PiiHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

import static com.fincore.account.dto.AccountDtos.*;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final String IFSC = "FNCR0000001";
    private static final List<AccountStatus> OPEN_STATUSES = List.of(AccountStatus.ACTIVE, AccountStatus.FROZEN);

    private final BankAccountRepository accountRepository;
    private final OtpService otpService;
    private final PiiHasher piiHasher;

    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public AccountListResponse myAccounts(AuthUser user) {
        List<AccountResponse> accounts = accountRepository
                .findByUserIdAndStatusInOrderByCreatedAtDesc(user.userId(), OPEN_STATUSES)
                .stream().map(AccountResponse::from).toList();
        return new AccountListResponse(!accounts.isEmpty(), accounts);
    }

    // Step 1: validate, save the application as PENDING, email the OTP
    @Transactional
    public InitiateResponse initiate(AuthUser user, OpenAccountRequest req) {
        if (!accountRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(user.userId(), OPEN_STATUSES).isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "You already have an account with FinCore Nexus");
        }

        String aadhaarHash = piiHasher.hash(req.aadhaarNumber());
        String panHash = piiHasher.hash(req.panNumber());

        if (accountRepository.existsByAadhaarHashAndStatusAndUserIdNot(aadhaarHash, AccountStatus.ACTIVE, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This Aadhaar number is already linked to another customer");
        }
        if (accountRepository.existsByPanHashAndStatusAndUserIdNot(panHash, AccountStatus.ACTIVE, user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This PAN is already linked to another customer");
        }

        // Reuse the user's earlier unfinished application, if any
        BankAccount account = accountRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.userId(), AccountStatus.PENDING_VERIFICATION)
                .orElseGet(BankAccount::new);

        account.setUserId(user.userId());
        account.setEmail(user.email());
        account.setFullName(req.fullName().trim());
        account.setAccountType(req.accountType());
        account.setAadhaarHash(aadhaarHash);
        account.setAadhaarLast4(req.aadhaarNumber().substring(8));
        account.setAadhaarMobile(req.aadhaarMobile());
        account.setPanHash(panHash);
        account.setPanMasked("XXXXXX" + req.panNumber().substring(6));
        account.setAddressLine(req.addressLine().trim());
        account.setCity(req.city().trim());
        account.setState(req.state().trim());
        account.setPincode(req.pincode());
        account.setStatus(AccountStatus.PENDING_VERIFICATION);
        account = accountRepository.save(account);

        otpService.generateAndSend(account);

        String masked = maskEmail(account.getEmail());
        return new InitiateResponse(account.getId(), masked,
                "We sent a 6-digit OTP to " + masked + ". Enter it to open your account.");
    }

    // Step 2: verify the OTP, then generate the account number and activate
    // noRollbackFor: wrong-attempt counters must be saved even when we throw
    @Transactional(noRollbackFor = ApiException.class)
    public AccountResponse verifyAndOpen(AuthUser user, VerifyOtpRequest req) {
        BankAccount account = accountRepository.findByIdAndUserId(req.accountId(), user.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));

        if (account.getStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new ApiException(HttpStatus.CONFLICT, "This application is already completed");
        }

        otpService.verify(account.getId(), req.otp());

        account.setAccountNumber(generateAccountNumber());
        account.setIfsc(IFSC);
        account.setStatus(AccountStatus.ACTIVE);
        account.setActivatedAt(Instant.now());
        return AccountResponse.from(accountRepository.save(account));
    }

    @Transactional
    public MessageResponse resend(AuthUser user, String accountId) {
        BankAccount account = accountRepository.findByIdAndUserId(accountId, user.userId())
                .filter(a -> a.getStatus() == AccountStatus.PENDING_VERIFICATION)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Application not found"));
        otpService.generateAndSend(account);
        return new MessageResponse("A new OTP has been sent to your email.");
    }

    // 12 digits: 1001 + 8 random digits, checked for uniqueness
    private String generateAccountNumber() {
        for (int i = 0; i < 10; i++) {
            String candidate = "1001" + String.format("%08d", random.nextInt(100_000_000));
            if (!accountRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Could not generate an account number. Please try again.");
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***" + email.substring(Math.max(at, 0));
        return email.charAt(0) + "***" + email.substring(at);
    }
}