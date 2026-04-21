package com.dataart.chat.message;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadReceiptRepository extends JpaRepository<ReadReceipt, ReadReceipt.PK> {

    Optional<ReadReceipt> findByChatIdAndUserId(Long chatId, Long userId);

    List<ReadReceipt> findByUserIdAndChatIdIn(Long userId, List<Long> chatIds);
}
