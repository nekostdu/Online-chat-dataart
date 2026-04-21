package com.dataart.chat;

import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatBanRepository;
import com.dataart.chat.chat.ChatMemberRepository;
import com.dataart.chat.chat.ChatRepository;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.chat.RoomInvitationService;
import com.dataart.chat.chat.RoomMembershipService;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ChatServiceIT extends AbstractIT {

    @Autowired ChatService chatService;
    @Autowired RoomMembershipService membership;
    @Autowired RoomInvitationService invitationService;
    @Autowired ChatRepository chats;
    @Autowired ChatMemberRepository members;
    @Autowired ChatBanRepository bans;
    @Autowired UserService users;
    @Autowired TestDb db;

    User alice, bob, carol;

    @BeforeEach
    void setUp() {
        db.wipe();
        alice = users.register("alice@x.io", "alice", "hunter2!@");
        bob   = users.register("bob@x.io",   "bob",   "hunter2!@");
        carol = users.register("carol@x.io", "carol", "hunter2!@");
    }

    @Test
    void createRoomMakesCreatorOwnerAndFirstMember() {
        Chat c = chatService.createRoom(alice.getId(), "general", "desc", "public");
        assertThat(c.getId()).isNotNull();
        assertThat(c.getOwnerId()).isEqualTo(alice.getId());
        assertThat(members.countByChatId(c.getId())).isEqualTo(1L);
        assertThat(members.findByChatIdAndUserId(c.getId(), alice.getId()).orElseThrow().isOwner())
            .isTrue();
    }

    @Test
    void roomNameMustBeUnique() {
        chatService.createRoom(alice.getId(), "engineering", "desc", "public");
        assertThatThrownBy(() -> chatService.createRoom(bob.getId(), "ENGINEERING", "", "public"))
            .isInstanceOf(ApiException.class).hasMessageContaining("name");
    }

    @Test
    void publicCatalogSearchesByName() {
        chatService.createRoom(alice.getId(), "general",     "", "public");
        chatService.createRoom(alice.getId(), "engineering", "", "public");
        chatService.createRoom(alice.getId(), "secret-ops",  "", "private");
        assertThat(chatService.searchPublicRooms("", 50)).hasSize(2);
        assertThat(chatService.searchPublicRooms("eng", 50)).hasSize(1);
        assertThat(chatService.searchPublicRooms("secret", 50)).isEmpty(); // private not listed
    }

    @Test
    void joinPublicRoomAddsMemberAndRejectsPrivate() {
        Chat pub  = chatService.createRoom(alice.getId(), "public-room",  "", "public");
        Chat priv = chatService.createRoom(alice.getId(), "private-room", "", "private");

        membership.joinPublicRoom(pub.getId(), bob.getId());
        assertThat(members.findByChatIdAndUserId(pub.getId(), bob.getId())).isPresent();

        assertThatThrownBy(() -> membership.joinPublicRoom(priv.getId(), bob.getId()))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void ownerCannotLeaveTheirRoom() {
        Chat c = chatService.createRoom(alice.getId(), "general", "", "public");
        assertThatThrownBy(() -> membership.leaveRoom(c.getId(), alice.getId()))
            .isInstanceOf(ApiException.class).hasMessageContaining("owner");
    }

    @Test
    void kickingAddsToBansAndBlocksRejoin() {
        Chat c = chatService.createRoom(alice.getId(), "general", "", "public");
        membership.joinPublicRoom(c.getId(), bob.getId());
        membership.kickMember(c.getId(), alice.getId(), bob.getId());
        assertThat(members.findByChatIdAndUserId(c.getId(), bob.getId())).isEmpty();
        assertThat(bans.existsByChatIdAndUserId(c.getId(), bob.getId())).isTrue();
        assertThatThrownBy(() -> membership.joinPublicRoom(c.getId(), bob.getId()))
            .isInstanceOf(ApiException.class).hasMessageContaining("banned");
    }

    @Test
    void ownerCannotBeRemovedOrDemoted() {
        Chat c = chatService.createRoom(alice.getId(), "general", "", "public");
        membership.joinPublicRoom(c.getId(), bob.getId());
        membership.makeAdmin(c.getId(), alice.getId(), bob.getId());
        // bob (admin) cannot kick owner
        assertThatThrownBy(() -> membership.kickMember(c.getId(), bob.getId(), alice.getId()))
            .isInstanceOf(ApiException.class);
        // bob (admin) cannot demote owner
        assertThatThrownBy(() -> membership.removeAdmin(c.getId(), bob.getId(), alice.getId()))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void onlyOwnerCanRemoveOtherAdmins() {
        Chat c = chatService.createRoom(alice.getId(), "general", "", "public");
        membership.joinPublicRoom(c.getId(), bob.getId());
        membership.joinPublicRoom(c.getId(), carol.getId());
        membership.makeAdmin(c.getId(), alice.getId(), bob.getId());
        membership.makeAdmin(c.getId(), alice.getId(), carol.getId());
        // admin bob cannot kick admin carol
        assertThatThrownBy(() -> membership.kickMember(c.getId(), bob.getId(), carol.getId()))
            .isInstanceOf(ApiException.class);
        // owner alice can
        membership.kickMember(c.getId(), alice.getId(), carol.getId());
        assertThat(members.findByChatIdAndUserId(c.getId(), carol.getId())).isEmpty();
    }

    @Test
    void invitationAcceptsAndBecomesMember() {
        Chat priv = chatService.createRoom(alice.getId(), "vip-room", "", "private");
        var inv = invitationService.invite(priv.getId(), alice.getId(), bob.getId());
        invitationService.acceptInvitation(inv.getId(), bob.getId());
        assertThat(members.findByChatIdAndUserId(priv.getId(), bob.getId())).isPresent();
    }

    @Test
    void openDmCreatesAndReusesChat() {
        Chat a = chatService.openDm(alice.getId(), bob.getId());
        Chat b = chatService.openDm(bob.getId(),   alice.getId());
        assertThat(a.getId()).isEqualTo(b.getId());
        assertThat(a.isDm()).isTrue();
        assertThat(members.countByChatId(a.getId())).isEqualTo(2L);
    }

    @Test
    void deleteAccountCascadesOwnedRooms() {
        Chat room = chatService.createRoom(alice.getId(), "dying-room", "", "public");
        users.deleteAccount(alice.getId());
        assertThat(chats.findActive(room.getId())).isEmpty();
    }
}
