package com.fincore.auth.config;

import com.fincore.auth.entity.User;
import com.fincore.auth.enums.Role;
import com.fincore.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            return;
        }

        String email = adminEmail.trim().toLowerCase();

        // The email may already belong to a customer. Never stop the whole service because of that.
        if (userRepository.findByEmail(email).isPresent()) {
            log.error("No ADMIN account exists yet, but {} is already registered with a different role. "
                    + "Set ADMIN_EMAIL to another address and restart "
                    + "(with Gmail you can use yourname+admin@gmail.com).", email);
            return;
        }

        User admin = new User();
        admin.setEmail(email);
        admin.setFullName("System Administrator");
        admin.setRole(Role.ADMIN);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setEmailVerified(true);
        admin.setEnabled(true);
        userRepository.save(admin);
        log.warn("Created the first ADMIN account: {}. Change its password after the first sign-in.", email);
    }
}