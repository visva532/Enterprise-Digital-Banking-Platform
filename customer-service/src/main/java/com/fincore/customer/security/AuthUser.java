package com.fincore.customer.security;

public record AuthUser(String userId, String email, String role) {}