package com.dataart.chat.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatInvitationRepository extends JpaRepository<ChatInvitation, Long> {

    @Query("SELECT i FROM ChatInvitation i WHERE i.chatId = :chatId AND i.invitedUserId = :userId " +
           "AND i.acceptedAt IS NULL AND i.declinedAt IS NULL")
    Optional<ChatInvitation> findPending(@Param("chatId") Long chatId, @Param("userId") Long userId);

    @Query("SELECT i FROM ChatInvitation i WHERE i.invitedUserId = :userId " +
           "AND i.acceptedAt IS NULL AND i.declinedAt IS NULL ORDER BY i.createdAt DESC")
    List<ChatInvitation> findPendingForUser(@Param("userId") Long userId);

    @Query("SELECT i FROM ChatInvitation i WHERE i.chatId = :chatId " +
           "AND i.acceptedAt IS NULL AND i.declinedAt IS NULL ORDER BY i.createdAt DESC")
    List<ChatInvitation> findPendingForChat(@Param("chatId") Long chatId);
}
