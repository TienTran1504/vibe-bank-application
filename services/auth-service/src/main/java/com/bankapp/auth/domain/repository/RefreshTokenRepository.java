package com.bankapp.auth.domain.repository;

import com.bankapp.auth.domain.entity.RefreshToken;
import com.bankapp.auth.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken t SET t.revoked = true WHERE t.user = :user")
    void revokeAllByUser(@Param("user") User user);
}
