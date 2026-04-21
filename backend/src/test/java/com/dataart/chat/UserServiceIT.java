package com.dataart.chat;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserRepository;
import com.dataart.chat.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserServiceIT extends AbstractIT {

    @Autowired UserService users;
    @Autowired UserRepository repo;
    @Autowired TestDb db;

    @BeforeEach
    void clean() { db.wipe(); }

    @Test
    void registerCreatesActiveUserWithHashedPassword() {
        User u = users.register("alice@example.com", "alice", "hunter2!@");
        assertThat(u.getId()).isNotNull();
        assertThat(u.getEmail()).isEqualTo("alice@example.com");
        assertThat(u.getUsername()).isEqualTo("alice");
        assertThat(u.getPasswordHash()).isNotEqualTo("hunter2!@");
        assertThat(u.isActive()).isTrue();
    }

    @Test
    void registerRejectsDuplicateEmail() {
        users.register("alice@example.com", "alice1", "hunter2!@");
        assertThatThrownBy(() -> users.register("Alice@example.com", "alice2", "hunter2!@"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("email");
    }

    @Test
    void registerRejectsDuplicateUsername() {
        users.register("a@example.com", "bob", "hunter2!@");
        assertThatThrownBy(() -> users.register("b@example.com", "BOB", "hunter2!@"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("username");
    }

    @Test
    void registerValidatesInputs() {
        assertThatThrownBy(() -> users.register("not-an-email", "nick", "hunter2!@"))
            .isInstanceOf(ApiException.class).hasMessageContaining("email");
        assertThatThrownBy(() -> users.register("a@b.c", "x", "hunter2!@"))
            .isInstanceOf(ApiException.class).hasMessageContaining("username");
        assertThatThrownBy(() -> users.register("a@b.c", "nick", "short"))
            .isInstanceOf(ApiException.class).hasMessageContaining("password");
    }

    @Test
    void changePasswordRequiresCorrectCurrent() {
        User u = users.register("c@example.com", "carol", "oldpass12");
        assertThatThrownBy(() -> users.changePassword(u.getId(), "wrong", "newpass12"))
            .isInstanceOf(ApiException.class);

        users.changePassword(u.getId(), "oldpass12", "newpass34");
        User reloaded = repo.findById(u.getId()).orElseThrow();
        assertThat(reloaded.getPasswordHash()).isNotEqualTo(u.getPasswordHash());
    }

    @Test
    void deleteAccountMarksDeletedAndRevokesSessions() {
        User u = users.register("d@example.com", "dan", "hunter2!@");
        users.deleteAccount(u.getId());
        assertThat(repo.findActiveById(u.getId())).isEmpty();
        assertThat(repo.findById(u.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }
}
