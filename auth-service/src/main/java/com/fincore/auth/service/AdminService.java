package com.fincore.auth.service;

import com.fincore.auth.entity.User;
import com.fincore.auth.enums.Role;
import com.fincore.auth.exception.ApiException;
import com.fincore.auth.repository.UserRepository;
import com.fincore.auth.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.fincore.auth.dto.AdminDtos.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final List<Role> STAFF_ROLES = List.of(Role.TELLER, Role.MANAGER, Role.ADMIN);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<UserSummary> listEmployees() {
        return userRepository.findByRoleInOrderByCreatedAtDesc(STAFF_ROLES)
                .stream().map(UserSummary::from).toList();
    }

    @Transactional
    public UserSummary createEmployee(CreateEmployeeRequest req) {
        if (!STAFF_ROLES.contains(req.role())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Employee role must be TELLER, MANAGER or ADMIN");
        }
        String email = req.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "A user with this email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setFullName(req.fullName().trim());
        user.setRole(req.role());
        user.setPasswordHash(passwordEncoder.encode(req.temporaryPassword()));
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        emailService.sendEmployeeCreated(email, user.getFullName(), user.getRole().name());
        return UserSummary.from(user);
    }

    @Transactional
    public UserSummary changeRole(String userId, Role newRole, AuthUser actor) {
        if (!STAFF_ROLES.contains(newRole)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role must be TELLER, MANAGER or ADMIN");
        }
        if (userId.equals(actor.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You cannot change your own role");
        }
        User user = find(userId);
        if (user.getRole() == Role.CUSTOMER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Customers cannot be converted to employees");
        }
        user.setRole(newRole);
        return UserSummary.from(userRepository.save(user));
    }

    @Transactional
    public UserSummary setEnabled(String userId, boolean enabled, AuthUser actor) {
        if (userId.equals(actor.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "You cannot deactivate your own account");
        }
        User user = find(userId);
        user.setEnabled(enabled);
        return UserSummary.from(userRepository.save(user));
    }

    private User find(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}