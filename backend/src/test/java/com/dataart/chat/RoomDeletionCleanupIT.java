package com.dataart.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.attachment.FileStorageService;
import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatRepository;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.message.Attachment;
import com.dataart.chat.message.AttachmentRepository;
import com.dataart.chat.message.MessageRepository;
import com.dataart.chat.message.MessageService;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserService;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Room deletion hard-removes rows + unlinks uploaded files from the volume. Req 2.4.6. */
class RoomDeletionCleanupIT extends AbstractIT {

    @Autowired ChatService chatService;
    @Autowired ChatRepository chats;
    @Autowired MessageService messages;
    @Autowired MessageRepository messageRepo;
    @Autowired AttachmentRepository attachments;
    @Autowired FileStorageService storage;
    @Autowired UserService users;
    @Autowired TestDb db;

    User alice;

    @BeforeEach
    void setUp() {
        db.wipe();
        alice = users.register("a@x.io", "alice", "pw12345678");
    }

    @Test
    void deletingRoomUnlinksAttachmentFilesAndPurgesRows() throws Exception {
        Chat room = chatService.createRoom(alice.getId(), "doomed", "", "public");

        // Pre-place an attachment row + backing file as if uploaded via the API.
        String relative = "test/" + UUID.randomUUID() + ".bin";
        Path full = storage.resolve(relative);
        Files.createDirectories(full.getParent());
        Files.writeString(full, "payload");
        assertThat(Files.exists(full)).isTrue();

        Attachment att = new Attachment();
        att.setOriginalName("payload.bin");
        att.setStoredPath(relative);
        att.setMimeType("application/octet-stream");
        att.setSizeBytes(7);
        att.setImage(false);
        att.setUploadedBy(alice.getId());
        attachments.save(att);

        // Attach it to a real message in this room.
        var msg = messages.send(room.getId(), alice.getId(), "see file",
            null, java.util.List.of(att.getId()));
        assertThat(attachments.findById(att.getId()).orElseThrow().getMessageId())
            .isEqualTo(msg.id());

        // Act: owner deletes the room.
        chatService.deleteRoom(room.getId(), alice.getId());

        // Chat row is gone — cascade wipes messages + attachments rows.
        assertThat(chats.findById(room.getId())).isEmpty();
        assertThat(attachments.findById(att.getId())).isEmpty();
        assertThat(messageRepo.findById(msg.id())).isEmpty();

        // And the physical file is gone too (TransactionalEventListener ran after commit).
        assertThat(Files.exists(full)).isFalse();
    }

    @Test
    void deletingAccountCascadesOwnedRoomsHard() {
        Chat room = chatService.createRoom(alice.getId(), "owned", "", "public");
        messages.send(room.getId(), alice.getId(), "hi", null, null);

        users.deleteAccount(alice.getId());

        assertThat(chats.findById(room.getId())).isEmpty();
    }
}
