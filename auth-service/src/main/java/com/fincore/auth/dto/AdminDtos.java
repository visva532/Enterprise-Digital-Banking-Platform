package com.fincore.auth.dto;

import com.fincore.auth.entity.User;
import com.fincore.auth.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AdminDtos {

    private AdminDtos() {}

    public record CreateEmployeeRequest(
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Email String email,
            @NotNull Role role,
            @NotBlank @Pattern(regexp = AuthDtos.PASSWORD_REGEX, message = AuthDtos.PASSWORD_MSG) String temporaryPassword) {}

    public record ChangeRoleRequest(@NotNull Role role) {}

    public record SetEnabledRequest(boolean enabled) {}

    public record UserSummary(String id, String email, String fullName, Role role, boolean enabled, Instant createdAt) {
        public static UserSummary from(User u) {
            return new UserSummary(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.isEnabled(), u.getCreatedAt());
        }
    }
}