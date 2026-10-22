package com.fincore.customer.dto;

import com.fincore.customer.entity.Customer;
import com.fincore.customer.enums.KycStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public final class CustomerDtos {

    private CustomerDtos() {}

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number") String phone,
            @Past LocalDate dateOfBirth,
            @Size(max = 200) String addressLine,
            @Size(max = 80) String city,
            @Size(max = 80) String state,
            @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits") String pincode) {}

    public record CustomerResponse(
            String id,
            String userId,
            String email,
            String fullName,
            String phone,
            LocalDate dateOfBirth,
            String addressLine,
            String city,
            String state,
            String pincode,
            KycStatus kycStatus,
            boolean profileCompleted) {

        public static CustomerResponse from(Customer c) {
            return new CustomerResponse(
                    c.getId(), c.getUserId(), c.getEmail(), c.getFullName(), c.getPhone(),
                    c.getDateOfBirth(), c.getAddressLine(), c.getCity(), c.getState(), c.getPincode(),
                    c.getKycStatus(),
                    c.getFullName() != null && c.getPhone() != null);
        }
    }
}