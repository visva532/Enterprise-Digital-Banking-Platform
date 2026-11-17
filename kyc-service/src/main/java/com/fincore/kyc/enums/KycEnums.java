package com.fincore.kyc.enums;

public final class KycEnums {

    private KycEnums() {}

    public enum KycStatus { PENDING, VERIFIED, REJECTED, EXPIRED }

    public enum ApplicationStatus { PENDING_OTP, UNDER_REVIEW, APPROVED, REJECTED }

    public enum ApplicationType { INITIAL, RE_KYC }

    public enum RiskLevel { LOW, MEDIUM, HIGH }

    public enum Gender { MALE, FEMALE, OTHER }

    public enum Occupation { SALARIED, SELF_EMPLOYED, BUSINESS, STUDENT, RETIRED, HOMEMAKER, OTHER }

    public enum IncomeRange { UPTO_2_5L, FROM_2_5_TO_5L, FROM_5_TO_10L, FROM_10_TO_25L, ABOVE_25L }

    public enum DocumentKind { ID_PROOF, SELFIE }
}