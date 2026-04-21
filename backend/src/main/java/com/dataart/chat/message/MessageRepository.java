package com.dataart.chat.message;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
        SELECT m FROM Message m
        WHERE m.chatId = :chatId
          AND (:before = 0 OR m.id < :before)
        ORDER BY m.id DESC
        """)
    List<Message> findPage(@Param("chatId") Long chatId, @Param("before") long before, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.id IN :ids")
    List<Message> findByIds(@Param("ids") List<Long> ids);

    /** Last message id in a chat, or null. */
    @Query("SELECT MAX(m.id) FROM Message m WHERE m.chatId = :chatId AND m.deletedAt IS NULL")
    Optional<Long> lastId(@Param("chatId") Long chatId);
}
