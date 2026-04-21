package com.dataart.chat.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ChatBanRepository extends JpaRepository<ChatBan, ChatBan.PK> {

    Optional<ChatBan> findByChatIdAndUserId(Long chatId, Long userId);

    List<ChatBan> findByChatId(Long chatId);

    boolean existsByChatIdAndUserId(Long chatId, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ChatBan b WHERE b.chatId = :chatId AND b.userId = :userId")
    int deleteByChatIdAndUserId(@Param("chatId") Long chatId, @Param("userId") Long userId);
}
