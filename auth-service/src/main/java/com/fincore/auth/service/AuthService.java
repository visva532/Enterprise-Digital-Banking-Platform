package com.fincore.auth.service;

import com.fincore.auth.entity.User;
import com.fincore.auth.enums.OtpPurpose;
import com.fincore.auth.enums.Role;
import com.fincore.auth.exception.ApiException;
import com.fincore.auth.repository.UserRepository;
import com.fincore.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import static com.fincore.auth.dto.AuthDtos.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;

    public MessageResponse signUp(SignUpRequest req) {
        String email = normalize(req.email());
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.isEmailVerified()) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists. Please sign in.");
        }
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setRole(Role.CUSTOMER);     // public signup is always CUSTOMER
        }
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        userRepository.save(user);

        otpService.generateAndSend(email, OtpPurpose.SIGNUP);
        return new MessageResponse("We sent a 6-digit OTP to your email. Enter it to activate your account.");
    }

    public AuthResponse verifySignupOtp(VerifyOtpRequest req) {
        String email = normalize(req.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid email or OTP"));
        if (user.isEmailVerified()) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already verified. Please sign in.");
        }
        otpService.verify(email, req.otp(), OtpPurpose.SIGNUP);

        user.setEmailVerified(true);
        userRepository.save(user);
        return buildAuthResponse(user);      // user is logged in right after verifying
    }

    public MessageResponse resendSignupOtp(String rawEmail) {
        String email = normalize(rawEmail);
        userRepository.findByEmail(email)
                .filter(u -> !u.isEmailVerified())
                .ifPresent(u -> otpService.generateAndSend(email, OtpPurpose.SIGNUP));
        return new MessageResponse("If this email is waiting for verification, a new OTP has been sent.");
    }

    public AuthResponse signIn(SignInRequest req) {
        String email = normalize(req.email());
        User user = userRepository.findByEmail(email)
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email not verified. Please verify your OTP first.");
        }
        if (!user.isEnabled()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is disabled. Please contact support.");
        }
        return buildAuthResponse(user);
    }

    public MessageResponse forgotPassword(String rawEmail) {
        String email = normalize(rawEmail);
        userRepository.findByEmail(email)
                .filter(User::isEmailVerified)
                .ifPresent(u -> otpService.generateAndSend(email, OtpPurpose.RESET_PASSWORD));
        // Same message whether or not the email exists, so attackers can't discover accounts
        return new MessageResponse("If an account exists for this email, an OTP has been sent.");
    }

    public MessageResponse resetPassword(ResetPasswordRequest req) {
        String email = normalize(req.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid email or OTP"));

        otpService.verify(email, req.otp(), OtpPurpose.RESET_PASSWORD);

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return new MessageResponse("Password reset successful. Please sign in.");
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(
                jwtService.generateToken(user),
                "Bearer",
                jwtService.getExpiresInSeconds(),
                user.getId(),
                user.getEmail(),
                user.getRole().name());
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }
}