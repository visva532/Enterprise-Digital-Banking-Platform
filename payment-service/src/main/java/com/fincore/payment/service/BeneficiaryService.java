package com.fincore.payment.service;

import com.fincore.payment.client.AccountClient;
import com.fincore.payment.dto.AccountApiDtos.AccountLookup;
import com.fincore.payment.entity.Beneficiary;
import com.fincore.payment.exception.ApiException;
import com.fincore.payment.repository.BeneficiaryRepository;
import com.fincore.payment.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

import static com.fincore.payment.dto.PaymentDtos.*;

@Service
@RequiredArgsConstructor
public class BeneficiaryService {

    private static final int MAX_PER_USER = 50;

    private final BeneficiaryRepository repository;
    private final AccountClient accountClient;

    public List<BeneficiaryResponse> list(AuthUser user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.userId())
                .stream().map(BeneficiaryResponse::from).toList();
    }

    public BeneficiaryResponse add(AuthUser user, AddBeneficiaryRequest req) {
        if (repository.existsByUserIdAndAccountNumber(user.userId(), req.accountNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "This payee is already saved");
        }
        if (repository.countByUserId(user.userId()) >= MAX_PER_USER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You can save up to " + MAX_PER_USER + " payees");
        }
        AccountLookup account = accountClient.lookup(req.accountNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found with this number"));
        if (!"ACTIVE".equals(account.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "This account cannot receive money right now");
        }
        if (account.userId().equals(user.userId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot add your own account as a payee");
        }

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUserId(user.userId());
        beneficiary.setAccountNumber(account.accountNumber());
        beneficiary.setHolderName(account.holderName());
        beneficiary.setNickname(req.nickname() == null || req.nickname().isBlank() ? null : req.nickname().trim());
        return BeneficiaryResponse.from(repository.save(beneficiary));
    }

    public void remove(AuthUser user, String id) {
        Beneficiary beneficiary = repository.findByIdAndUserId(id, user.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payee not found"));
        repository.delete(beneficiary);
    }
}