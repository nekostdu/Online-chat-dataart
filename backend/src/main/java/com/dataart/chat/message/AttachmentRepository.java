package com.dataart.chat.message;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByMessageId(Long messageId);

    List<Attachment> findByMessageIdIn(List<Long> messageIds);

    @Modifying
    @Transactional
    @Query("UPDATE Attachment a SET a.messageId = :messageId WHERE a.id IN :ids AND a.uploadedBy = :uploader AND a.messageId IS NULL")
    int attachToMessage(@Param("ids") List<Long> ids,
                        @Param("messageId") Long messageId,
                        @Param("uploader") Long uploader);

    /** All stored file paths for attachments posted to the given chat. */
    @Query("""
        SELECT a.storedPath FROM Attachment a, Message m
        WHERE a.messageId = m.id AND m.chatId = :chatId
        """)
    List<String> findStoredPathsByChatId(@Param("chatId") Long chatId);
}
