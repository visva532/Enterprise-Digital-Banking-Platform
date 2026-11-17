package com.fincore.kyc.service;

import com.fincore.kyc.entity.KycApplication;
import com.fincore.kyc.enums.KycEnums.IncomeRange;
import com.fincore.kyc.enums.KycEnums.Occupation;
import com.fincore.kyc.enums.KycEnums.RiskLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class VerificationService {

    public record Outcome(int riskScore, RiskLevel level, int faceMatchScore, List<String> reasons, boolean autoApprove) {}

    private final List<String> watchlist;

    public VerificationService(@Value("${app.kyc.watchlist}") List<String> watchlist) {
        this.watchlist = watchlist.stream().map(s -> s.trim().toUpperCase()).filter(s -> !s.isEmpty()).toList();
    }

    // LOW risk = approved automatically. MEDIUM and HIGH go to a human reviewer.
    public Outcome assess(KycApplication application, byte[] selfie) {
        int score = 0;
        List<String> reasons = new ArrayList<>();

        // SIMULATED face match (80-99), computed from the selfie file. A real provider replaces this.
        int face = 80 + Math.floorMod(Arrays.hashCode(selfie), 20);
        if (face < 85) {
            score += 30;
            reasons.add("Face match " + face + "% is below the 85% threshold (simulated)");
        }

        if (application.isPoliticallyExposed()) {
            score += 40;
            reasons.add("Customer declared a politically exposed person");
        }

        String name = application.getFullName().toUpperCase();
        if (watchlist.stream().anyMatch(name::contains)) {
            score += 60;
            reasons.add("Name matches the demo sanctions watchlist");
        }

        if (application.getOccupation() == Occupation.STUDENT && application.getIncomeRange() == IncomeRange.ABOVE_25L) {
            score += 30;
            reasons.add("Declared income looks inconsistent with the occupation");
        }

        RiskLevel level = score >= 60 ? RiskLevel.HIGH : score >= 30 ? RiskLevel.MEDIUM : RiskLevel.LOW;
        if (reasons.isEmpty()) {
            reasons.add("All automated checks passed");
        }
        return new Outcome(score, level, face, reasons, level == RiskLevel.LOW);
    }
}