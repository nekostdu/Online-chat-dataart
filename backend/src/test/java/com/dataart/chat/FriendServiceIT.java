package com.dataart.chat;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.friend.FriendService;
import com.dataart.chat.friend.Friendship;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FriendServiceIT extends AbstractIT {

    @Autowired FriendService friends;
    @Autowired UserService users;
    @Autowired TestDb db;

    User alice, bob;

    @BeforeEach
    void setUp() {
        db.wipe();
        alice = users.register("alice@x.io", "alice", "hunter2!@");
        bob   = users.register("bob@x.io",   "bob",   "hunter2!@");
    }

    @Test
    void sendAndAcceptFriendRequest() {
        Friendship f = friends.sendRequest(alice.getId(), bob.getId(), "hi");
        assertThat(f.isPending()).isTrue();
        assertThat(friends.areFriends(alice.getId(), bob.getId())).isFalse();

        friends.accept(alice.getId(), bob.getId(), bob.getId());
        assertThat(friends.areFriends(alice.getId(), bob.getId())).isTrue();
    }

    @Test
    void declineDeletesTheRequest() {
        friends.sendRequest(alice.getId(), bob.getId(), null);
        friends.decline(alice.getId(), bob.getId(), bob.getId());
        assertThat(friends.listIncomingPending(bob.getId())).isEmpty();
    }

    @Test
    void reciprocalRequestAutoAccepts() {
        friends.sendRequest(alice.getId(), bob.getId(), null);
        Friendship f = friends.sendRequest(bob.getId(), alice.getId(), null);
        assertThat(f.isAccepted()).isTrue();
    }

    @Test
    void blockTerminatesFriendshipAndIsSymmetric() {
        friends.sendRequest(alice.getId(), bob.getId(), null);
        friends.accept(alice.getId(), bob.getId(), bob.getId());

        friends.block(alice.getId(), bob.getId());
        assertThat(friends.areFriends(alice.getId(), bob.getId())).isFalse();
        assertThat(friends.isBlocked(alice.getId(), bob.getId())).isTrue();
        assertThat(friends.isBlocked(bob.getId(), alice.getId())).isTrue();
    }

    @Test
    void cannotSendRequestToBlockedUser() {
        friends.block(alice.getId(), bob.getId());
        assertThatThrownBy(() -> friends.sendRequest(bob.getId(), alice.getId(), null))
            .isInstanceOf(ApiException.class).hasMessageContaining("blocked");
    }
}
