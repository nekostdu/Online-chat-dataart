package com.dataart.chat.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatMemberRepository extends JpaRepository<ChatMember, ChatMember.PK> {

    Optional<ChatMember> findByChatIdAndUserId(Long chatId, Long userId);

    List<ChatMember> findByChatId(Long chatId);

    /** Paged members, ordered by role (owner/admin first) then join-time. */
    @Query("""
        SELECT m FROM ChatMember m
        WHERE m.chatId = :chatId
        ORDER BY
          CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
          m.joinedAt ASC
        """)
    List<ChatMember> findByChatIdPaged(@Param("chatId") Long chatId, org.springframework.data.domain.Pageable pageable);

    List<ChatMember> findByUserId(Long userId);

    @Query("SELECT COUNT(m) FROM ChatMember m WHERE m.chatId = :chatId")
    long countByChatId(@Param("chatId") Long chatId);

    @Query("SELECT m.userId FROM ChatMember m WHERE m.chatId = :chatId")
    List<Long> findUserIdsByChatId(@Param("chatId") Long chatId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMember m WHERE m.chatId = :chatId AND m.userId = :userId")
    int deleteByChatIdAndUserId(@Param("chatId") Long chatId, @Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatMember m WHERE m.userId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}
