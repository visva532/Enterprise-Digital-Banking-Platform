package com.fincore.loan.security;


public record AuthUser(String userId, String email, String role) {}