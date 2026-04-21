package com.dataart.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatDtos.ChatSummary;
import com.dataart.chat.chat.ChatQueryService;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.chat.RoomMembershipService;
import com.dataart.chat.message.ChatMetricsRepository;
import com.dataart.chat.message.ChatMetricsRepository.UnreadMetric;
import com.dataart.chat.message.MessageService;
import com.dataart.chat.message.ReadReceipt;
import com.dataart.chat.message.ReadReceiptRepository;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Unread counts + lastMessageAt + ChatMetricsRepository native query. Req 2.7.1. */
class UnreadMetricsIT extends AbstractIT {

    @Autowired ChatService chatService;
    @Autowired RoomMembershipService membership;
    @Autowired UserService users;
    @Autowired MessageService messages;
    @Autowired ChatQueryService queries;
    @Autowired ChatMetricsRepository metrics;
    @Autowired ReadReceiptRepository receipts;
    @Autowired TestDb db;

    User alice, bob;
    Chat room;

    @BeforeEach
    void setUp() {
        db.wipe();
        alice = users.register("a@x.io", "alice", "pw12345678");
        bob   = users.register("b@x.io", "bob",   "pw12345678");
        room = chatService.createRoom(alice.getId(), "general", "", "public");
        membership.joinPublicRoom(room.getId(), bob.getId());
    }

    @Test
    void unreadExcludesOwnAndDeletedMessages() {
        // 5 messages from alice, 3 from bob, plus 2 alice deletes.
        Long firstDeletedId = null;
        for (int i = 0; i < 5; i++) {
            var dto = messages.send(room.getId(), alice.getId(), "from-alice-" + i, null, null);
            if (i == 0) firstDeletedId = dto.id();
        }
        for (int i = 0; i < 3; i++) {
            messages.send(room.getId(), bob.getId(), "from-bob-" + i, null, null);
        }
        messages.delete(firstDeletedId, alice.getId());   // alice deletes her own

        // From alice's perspective: only bob's messages (3) are unread, and all of alice's are excluded.
        List<UnreadMetric> aliceUnread = metrics.unread(alice.getId(), List.of(room.getId()));
        assertThat(aliceUnread).hasSize(1);
        assertThat(aliceUnread.get(0).getUnread()).isEqualTo(3L);

        // From bob's perspective: 5 - 1 deleted = 4 unread.
        List<UnreadMetric> bobUnread = metrics.unread(bob.getId(), List.of(room.getId()));
        assertThat(bobUnread).hasSize(1);
        assertThat(bobUnread.get(0).getUnread()).isEqualTo(4L);
    }

    @Test
    void unreadRespectsReadReceiptCursor() {
        var m1 = messages.send(room.getId(), alice.getId(), "old-1", null, null);
        var m2 = messages.send(room.getId(), alice.getId(), "old-2", null, null);
        messages.send(room.getId(), alice.getId(), "new-3", null, null);
        messages.send(room.getId(), alice.getId(), "new-4", null, null);

        // bob marks "old-2" as read
        ReadReceipt r = new ReadReceipt();
        r.setChatId(room.getId());
        r.setUserId(bob.getId());
        r.setLastReadMessageId(m2.id());
        r.setUpdatedAt(Instant.now());
        receipts.save(r);

        List<UnreadMetric> unread = metrics.unread(bob.getId(), List.of(room.getId()));
        assertThat(unread.get(0).getUnread()).isEqualTo(2L);   // only new-3 + new-4
    }

    @Test
    void myChatsDtoSurfacesUnreadAndLastMessageAt() {
        messages.send(room.getId(), alice.getId(), "hi",  null, null);
        messages.send(room.getId(), alice.getId(), "hi2", null, null);

        List<ChatSummary> fromBob = queries.myChats(bob.getId());
        assertThat(fromBob).singleElement().satisfies(cs -> {
            assertThat(cs.unreadCount()).isEqualTo(2L);
            assertThat(cs.lastMessageAt()).isNotNull();
            assertThat(cs.name()).isEqualTo("general");
        });

        List<ChatSummary> fromAlice = queries.myChats(alice.getId());
        // alice is author of all messages → unread count is zero for her.
        assertThat(fromAlice.get(0).unreadCount()).isEqualTo(0L);
    }
}
