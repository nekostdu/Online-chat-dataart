package com.dataart.chat.user;

import com.dataart.chat.auth.SessionService;
import com.dataart.chat.common.ApiException;
import java.time.Instant;
import java.util.regex.Pattern;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private static final Pattern USERNAME = Pattern.compile("^[a-zA-Z0-9_.-]{3,32}$");
    private static final Pattern EMAIL    = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessions;
    private final ApplicationEventPublisher events;

    public UserService(UserRepository users,
                       PasswordEncoder passwordEncoder,
                       SessionService sessions,
                       ApplicationEventPublisher events) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.events = events;
    }

    @Transactional
    public User register(String email, String username, String password) {
        validateEmail(email);
        validateUsername(username);
        validatePassword(password);
        if (users.findActiveByEmail(email).isPresent()) {
            throw ApiException.conflict("email already in use");
        }
        if (users.findActiveByUsername(username).isPresent()) {
            throw ApiException.conflict("username already in use");
        }
        User u = new User();
        u.setEmail(email.trim());
        u.setUsername(username.trim());
        u.setPasswordHash(passwordEncoder.encode(password));
        return users.save(u);
    }

    @Transactional
    public User changePassword(Long userId, String currentPassword, String newPassword) {
        User u = users.findActiveById(userId).orElseThrow(() -> ApiException.notFound("user"));
        if (!passwordEncoder.matches(currentPassword, u.getPasswordHash())) {
            throw ApiException.badRequest("current password is wrong");
        }
        validatePassword(newPassword);
        u.setPasswordHash(passwordEncoder.encode(newPassword));
        return u;
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User u = users.findActiveById(userId).orElseThrow(() -> ApiException.notFound("user"));
        validatePassword(newPassword);
        u.setPasswordHash(passwordEncoder.encode(newPassword));
        sessions.revokeAllForUser(userId);
    }

    /** Requirement 2.1.5 — delete account. Chat module cascades owned-room deletion via event. */
    @Transactional
    public void deleteAccount(Long userId) {
        User u = users.findActiveById(userId).orElseThrow(() -> ApiException.notFound("user"));
        u.setDeletedAt(Instant.now());
        sessions.revokeAllForUser(userId);
        events.publishEvent(new UserDeletedEvent(userId));
    }

    public User requireActive(Long userId) {
        return users.findActiveById(userId).orElseThrow(() -> ApiException.notFound("user"));
    }

    /** Stamp "last login" on successful authentication. */
    @Transactional
    public void markLogin(Long userId) {
        users.findActiveById(userId).ifPresent(u -> u.setLastLoginAt(Instant.now()));
    }

    private static void validateEmail(String email) {
        if (email == null || !EMAIL.matcher(email.trim()).matches()) {
            throw ApiException.badRequest("invalid email");
        }
    }

    private static void validateUsername(String username) {
        if (username == null || !USERNAME.matcher(username.trim()).matches()) {
            throw ApiException.badRequest("username must be 3–32 chars, letters/digits/._-");
        }
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 128) {
            throw ApiException.badRequest("password must be 8–128 chars");
        }
    }
}
