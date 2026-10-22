package com.fincore.customer.service;

import com.fincore.customer.entity.Customer;
import com.fincore.customer.exception.ApiException;
import com.fincore.customer.repository.CustomerRepository;
import com.fincore.customer.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.fincore.customer.dto.CustomerDtos.*;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;

    @Transactional
    public CustomerResponse getMyProfile(AuthUser user) {
        return CustomerResponse.from(getOrCreate(user));
    }

    @Transactional
    public CustomerResponse updateMyProfile(AuthUser user, UpdateProfileRequest req) {
        Customer c = getOrCreate(user);

        if (repository.existsByPhoneAndUserIdNot(req.phone(), user.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This phone number is already registered");
        }
        c.setFullName(req.fullName().trim());
        c.setPhone(req.phone());
        c.setDateOfBirth(req.dateOfBirth());
        c.setAddressLine(req.addressLine());
        c.setCity(req.city());
        c.setState(req.state());
        c.setPincode(req.pincode());
        return CustomerResponse.from(repository.save(c));
    }

    @Transactional(readOnly = true)
    public CustomerResponse getByUserId(String userId) {
        return repository.findByUserId(userId)
                .map(CustomerResponse::from)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer not found"));
    }

    // The profile row is created automatically the first time a logged-in user asks for it
    private Customer getOrCreate(AuthUser user) {
        return repository.findByUserId(user.userId()).orElseGet(() -> {
            Customer c = new Customer();
            c.setUserId(user.userId());
            c.setEmail(user.email());
            return repository.save(c);
        });
    }
}