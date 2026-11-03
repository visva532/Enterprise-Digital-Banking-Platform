package com.fincore.customer.controller;

import com.fincore.customer.dto.CustomerDtos.CustomerResponse;
import com.fincore.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/customers")
@RequiredArgsConstructor
public class StaffCustomerController {

    private final CustomerService customerService;

    @GetMapping
    public List<CustomerResponse> search(@RequestParam(defaultValue = "") String q) {
        return customerService.search(q);
    }
}