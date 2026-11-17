package com.fincore.kyc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync        // emails are sent in the background
@EnableScheduling   // expiry job and customer-service sync job
public class KycServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(KycServiceApplication.class, args);
    }
}