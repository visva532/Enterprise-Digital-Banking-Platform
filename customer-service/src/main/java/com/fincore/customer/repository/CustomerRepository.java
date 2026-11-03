package com.fincore.customer.repository;

import com.fincore.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {
    Optional<Customer> findByUserId(String userId);
    boolean existsByPhoneAndUserIdNot(String phone, String userId);
    @Query("""
            select c from Customer c
            where lower(coalesce(c.fullName, '')) like lower(concat('%', :q, '%'))
               or lower(c.email) like lower(concat('%', :q, '%'))
               or coalesce(c.phone, '') like concat('%', :q, '%')
            order by c.createdAt desc
            """)
    List<Customer> search(@Param("q") String q, Pageable pageable);
}