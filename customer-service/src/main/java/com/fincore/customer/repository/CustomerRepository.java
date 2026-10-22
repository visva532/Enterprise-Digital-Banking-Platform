package com.fincore.customer.repository;

import com.fincore.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUserId(String userId);
    boolean existsByPhoneAndUserIdNot(String phone, String userId);
}