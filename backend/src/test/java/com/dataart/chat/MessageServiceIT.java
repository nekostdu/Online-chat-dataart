package com.dataart.chat;

import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.chat.RoomMembershipService;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.friend.FriendService;
import com.dataart.chat.message.MessageDtos.MessageDto;
import com.dataart.chat.message.MessageService;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MessageServiceIT extends AbstractIT {

    @Autowired MessageService messages;
    @Autowired ChatService chatService;
    @Autowired RoomMembershipService membership;
    @Autowired FriendService friends;
    @Autowired UserService users;
    @Autowired TestDb db;

    User alice, bob;
    Chat room;

    @BeforeEach
    void setUp() {
        db.wipe();
        alice = users.register("alice@x.io", "alice", "hunter2!@");
        bob   = users.register("bob@x.io",   "bob",   "hunter2!@");
        room = chatService.createRoom(alice.getId(), "general", "", "public");
        membership.joinPublicRoom(room.getId(), bob.getId());
    }

    @Test
    void sendInRoomStoresAndReturnsDto() {
        MessageDto m = messages.send(room.getId(), alice.getId(), "hello", null, null);
        assertThat(m.id()).isNotNull();
        assertThat(m.chatId()).isEqualTo(room.getId());
        assertThat(m.authorUsername()).isEqualTo("alice");
        assertThat(m.text()).isEqualTo("hello");
    }

    @Test
    void editFlagsEditedAtAndRefusesForNonAuthor() {
        MessageDto m = messages.send(room.getId(), alice.getId(), "first", null, null);
        MessageDto edited = messages.edit(m.id(), alice.getId(), "updated");
        assertThat(edited.text()).isEqualTo("updated");
        assertThat(edited.editedAt()).isNotNull();
        assertThatThrownBy(() -> messages.edit(m.id(), bob.getId(), "hack"))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void authorOrAdminCanDelete() {
        MessageDto m = messages.send(room.getId(), bob.getId(), "bob writes", null, null);
        // author can delete own message
        MessageDto afterAuthor = messages.delete(m.id(), bob.getId());
        assertThat(afterAuthor.deletedAt()).isNotNull();

        // admin (alice) can delete bob's other message
        MessageDto m2 = messages.send(room.getId(), bob.getId(), "second", null, null);
        MessageDto afterAdmin = messages.delete(m2.id(), alice.getId());
        assertThat(afterAdmin.deletedAt()).isNotNull();
    }

    @Test
    void nonAdminNonAuthorCannotDelete() {
        Chat otherRoom = chatService.createRoom(bob.getId(), "bobs-room", "", "public");
        membership.joinPublicRoom(otherRoom.getId(), alice.getId());
        MessageDto m = messages.send(otherRoom.getId(), bob.getId(), "hi", null, null);
        assertThatThrownBy(() -> messages.delete(m.id(), alice.getId()))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void pageReturnsInChronologicalOrderAndPaginates() {
        for (int i = 0; i < 12; i++) {
            messages.send(room.getId(), alice.getId(), "m" + i, null, null);
        }
        List<MessageDto> firstPage = messages.page(room.getId(), alice.getId(), null, 5);
        assertThat(firstPage).hasSize(5);
        assertThat(firstPage.get(firstPage.size() - 1).text()).isEqualTo("m11");

        // older page
        Long before = firstPage.get(0).id();
        List<MessageDto> second = messages.page(room.getId(), alice.getId(), before, 5);
        assertThat(second).hasSize(5);
        assertThat(second.get(second.size() - 1).id()).isLessThan(before);
    }

    @Test
    void tooLongTextRejected() {
        String big = "x".repeat(5000);
        assertThatThrownBy(() -> messages.send(room.getId(), alice.getId(), big, null, null))
            .isInstanceOf(ApiException.class).hasMessageContaining("too long");
    }

    @Test
    void emptyMessageRejected() {
        assertThatThrownBy(() -> messages.send(room.getId(), alice.getId(), null, null, null))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> messages.send(room.getId(), alice.getId(), "  ", null, null))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void dmRequiresFriendshipAndRespectsBlock() {
        Chat dm = chatService.openDm(alice.getId(), bob.getId());
        // not friends yet
        assertThatThrownBy(() -> messages.send(dm.getId(), alice.getId(), "hi", null, null))
            .isInstanceOf(ApiException.class).hasMessageContaining("friend");

        friends.sendRequest(alice.getId(), bob.getId(), null);
        friends.accept(alice.getId(), bob.getId(), bob.getId());
        MessageDto m = messages.send(dm.getId(), alice.getId(), "hi friend", null, null);
        assertThat(m.id()).isNotNull();

        friends.block(alice.getId(), bob.getId());
        assertThatThrownBy(() -> messages.send(dm.getId(), bob.getId(), "oi", null, null))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> messages.send(dm.getId(), alice.getId(), "still?", null, null))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void replyingToOtherChatsMessageIsRejected() {
        Chat otherRoom = chatService.createRoom(alice.getId(), "other", "", "public");
        MessageDto m = messages.send(otherRoom.getId(), alice.getId(), "src", null, null);
        assertThatThrownBy(() -> messages.send(room.getId(), alice.getId(), "ref", m.id(), null))
            .isInstanceOf(ApiException.class).hasMessageContaining("reply");
    }
}
