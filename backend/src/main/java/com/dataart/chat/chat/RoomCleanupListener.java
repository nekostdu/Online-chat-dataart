package com.dataart.chat.chat;

import com.dataart.chat.attachment.FileStorageService;
import com.dataart.chat.message.MessageBroadcaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Post-commit fan-out for room hard-deletion: unlink uploaded files and broadcast
 * {@code chat.deleted} over STOMP. Split out of ChatService to keep the service thin.
 */
@Component
public class RoomCleanupListener {

    private static final Logger log = LoggerFactory.getLogger(RoomCleanupListener.class);

    private final FileStorageService fileStorage;
    private final MessageBroadcaster broadcaster;

    public RoomCleanupListener(FileStorageService fileStorage, MessageBroadcaster broadcaster) {
        this.fileStorage = fileStorage;
        this.broadcaster = broadcaster;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRoomDeleted(ChatService.RoomDeletedEvent e) {
        for (String path : e.filePaths()) {
            if (!fileStorage.deleteFile(path)) log.warn("failed to unlink uploaded file: {}", path);
        }
        broadcaster.roomDeleted(e.chatId(), e.formerMemberIds());
    }
}
