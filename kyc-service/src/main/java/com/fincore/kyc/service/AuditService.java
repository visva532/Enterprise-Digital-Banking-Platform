package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycAuditLog;
import com.fincore.kyc.repository.KycAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final KycAuditRepository repository;

    public void log(String applicationId, String userId, String action, String actor, String actorRole, String detail) {
        KycAuditLog entry = new KycAuditLog();
        entry.setApplicationId(applicationId);
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setActor(actor);
        entry.setActorRole(actorRole);
        entry.setDetail(detail == null ? null : (detail.length() > 300 ? detail.substring(0, 300) : detail));
        repository.save(entry);
    }
}