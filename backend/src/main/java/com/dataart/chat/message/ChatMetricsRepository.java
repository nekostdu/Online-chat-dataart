package com.dataart.chat.message;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** Read-only helper queries over the messages table for chat summaries. */
public interface ChatMetricsRepository extends Repository<Message, Long> {

    interface ChatMetric {
        Long getChatId();
        Long getLastMessageId();
        Instant getLastMessageAt();
    }

    @Query("""
        SELECT m.chatId AS chatId, MAX(m.id) AS lastMessageId, MAX(m.createdAt) AS lastMessageAt
        FROM Message m
        WHERE m.chatId IN :chatIds AND m.deletedAt IS NULL
        GROUP BY m.chatId
        """)
    List<ChatMetric> metrics(@Param("chatIds") List<Long> chatIds);

    interface UnreadMetric {
        Long getChatId();
        Long getUnread();
    }

    @Query(value = """
        SELECT m.chat_id AS chatId,
               COUNT(*)  AS unread
        FROM messages m
        LEFT JOIN read_receipts r
          ON r.chat_id = m.chat_id AND r.user_id = :userId
        WHERE m.chat_id IN :chatIds
          AND m.deleted_at IS NULL
          AND m.author_id <> :userId
          AND m.id > COALESCE(r.last_read_message_id, 0)
        GROUP BY m.chat_id
        """, nativeQuery = true)
    List<UnreadMetric> unread(@Param("userId") Long userId,
                              @Param("chatIds") List<Long> chatIds);
}
