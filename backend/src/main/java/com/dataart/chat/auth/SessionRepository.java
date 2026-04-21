package com.dataart.chat.auth;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface SessionRepository extends JpaRepository<Session, Long> {

    Optional<Session> findByTokenHash(String tokenHash);

    @Query("SELECT s FROM Session s WHERE s.userId = :userId AND s.revokedAt IS NULL ORDER BY s.lastSeenAt DESC")
    List<Session> findActiveByUser(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Session s SET s.revokedAt = :now WHERE s.userId = :userId AND s.revokedAt IS NULL")
    int revokeAllByUser(@Param("userId") Long userId, @Param("now") Instant now);
}
