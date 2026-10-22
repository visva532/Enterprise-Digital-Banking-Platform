package com.fincore.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public final class AuthDtos {

    private AuthDtos() {}

    public static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$";
    public static final String PASSWORD_MSG = "Password must be 8-64 characters with at least one letter and one number";

    public record SignUpRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String password) {}

    public record SignInRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record EmailRequest(
            @NotBlank @Email String email) {}

    public record VerifyOtpRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp) {}

    public record ResetPasswordRequest(
            @NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits") String otp,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String newPassword) {}

    public record AuthResponse(
            String accessToken,
            String tokenType,
            long expiresInSeconds,
            String userId,
            String email,
            String role) {}

    public record MessageResponse(String message) {}
}