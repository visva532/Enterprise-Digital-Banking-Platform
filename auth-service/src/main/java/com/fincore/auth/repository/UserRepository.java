package com.fincore.auth.repository;

import com.fincore.auth.entity.User;
import com.fincore.auth.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);

    boolean existsByRole(Role role);

    List<User> findByRoleInOrderByCreatedAtDesc(Collection<Role> roles);
}