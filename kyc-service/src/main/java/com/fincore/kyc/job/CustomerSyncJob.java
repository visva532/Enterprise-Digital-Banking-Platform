package com.fincore.kyc.job;

import com.fincore.kyc.client.CustomerClient;
import com.fincore.kyc.entity.KycProfile;
import com.fincore.kyc.repository.KycProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomerSyncJob {

    private final KycProfileRepository profiles;
    private final CustomerClient customerClient;

    @Scheduled(fixedDelay = 15_000, initialDelay = 20_000)
    public void sync() {
        for (KycProfile profile : profiles.findNeedingSync()) {
            if (customerClient.updateKycStatus(profile.getUserId(), profile.getEmail(), profile.getStatus())) {
                profile.setCustomerSyncedStatus(profile.getStatus());
                profiles.save(profile);
            }
        }
    }
}