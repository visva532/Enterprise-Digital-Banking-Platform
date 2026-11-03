package com.fincore.account.dto;

import com.fincore.account.entity.AccountAuditLog;
import com.fincore.account.entity.BankAccount;
import com.fincore.account.entity.Transaction;
import com.fincore.account.enums.AccountStatus;
import com.fincore.account.enums.AccountType;
import com.fincore.account.enums.TransactionType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class StaffDtos {

    private StaffDtos() {}

    public record StaffAccountView(
            String id, String userId, String accountNumber, String ifsc,
            AccountType accountType, AccountStatus status, BigDecimal balance,
            String fullName, String email, String mobile,
            String aadhaarMasked, String panMasked,
            String addressLine, String city, String state, String pincode,
            Instant openedAt) {

        public static StaffAccountView from(BankAccount a) {
            return new StaffAccountView(
                    a.getId(), a.getUserId(), a.getAccountNumber(), a.getIfsc(),
                    a.getAccountType(), a.getStatus(), a.getBalance(),
                    a.getFullName(), a.getEmail(), a.getAadhaarMobile(),
                    "XXXX XXXX " + a.getAadhaarLast4(), a.getPanMasked(),
                    a.getAddressLine(), a.getCity(), a.getState(), a.getPincode(),
                    a.getActivatedAt());
        }
    }

    public record TransactionView(
            String id, TransactionType type, BigDecimal amount, BigDecimal balanceAfter,
            String description, String reference, String createdBy, Instant createdAt) {

        public static TransactionView from(Transaction t) {
            return new TransactionView(t.getId(), t.getType(), t.getAmount(), t.getBalanceAfter(),
                    t.getDescription(), t.getReference(), t.getCreatedBy(), t.getCreatedAt());
        }
    }

    public record AuditView(Long id, String action, String actorEmail, String actorRole, String reason, Instant createdAt) {
        public static AuditView from(AccountAuditLog e) {
            return new AuditView(e.getId(), e.getAction(), e.getActorEmail(), e.getActorRole(), e.getReason(), e.getCreatedAt());
        }
    }

    public record StatusChangeRequest(
            @NotBlank @Size(min = 5, max = 300, message = "Please give a reason (5-300 characters)") String reason) {}

    public record DemoDepositRequest(
            @NotBlank @Pattern(regexp = "^\\d{12}$", message = "Enter the 12-digit account number") String accountNumber,
            @NotNull @DecimalMin(value = "1", message = "Minimum amount is 1")
            @DecimalMax(value = "10000000", message = "Maximum amount is 1,00,00,000") BigDecimal amount,
            @Size(max = 200) String description) {}

    public record DailyFlow(LocalDate date, BigDecimal credits, BigDecimal debits) {}

    public record DashboardResponse(
            long totalCustomers, long totalAccounts,
            long activeAccounts, long frozenAccounts, long blockedAccounts, long closedAccounts,
            BigDecimal totalDeposits, BigDecimal creditsToday, BigDecimal debitsToday, long transactionsToday,
            List<DailyFlow> last7Days, List<StaffAccountView> topAccounts) {}
}