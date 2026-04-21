package com.dataart.chat.auth;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserRepository;
import com.dataart.chat.user.UserService;
import java.time.Duration;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final Duration TTL = Duration.ofHours(1);

    private final PasswordResetTokenRepository tokens;
    private final UserRepository users;
    private final UserService userService;
    private final MailService mail;

    public PasswordResetService(PasswordResetTokenRepository tokens,
                                UserRepository users,
                                UserService userService,
                                MailService mail) {
        this.tokens = tokens;
        this.users = users;
        this.userService = userService;
        this.mail = mail;
    }

    /** Returns silently whether or not the email exists (avoid user enumeration). */
    @Transactional
    public void requestReset(String email) {
        users.findActiveByEmail(email).ifPresent(u -> {
            String raw = Tokens.random();
            PasswordResetToken t = new PasswordResetToken();
            t.setUserId(u.getId());
            t.setTokenHash(Tokens.hash(raw));
            t.setExpiresAt(Instant.now().plus(TTL));
            tokens.save(t);
            mail.sendPasswordReset(u.getEmail(), raw);
        });
    }

    @Transactional
    public void confirmReset(String rawToken, String newPassword) {
        PasswordResetToken t = tokens.findByTokenHash(Tokens.hash(rawToken))
            .orElseThrow(() -> ApiException.badRequest("invalid token"));
        if (t.getUsedAt() != null) throw ApiException.badRequest("token already used");
        if (t.getExpiresAt().isBefore(Instant.now())) throw ApiException.badRequest("token expired");

        User u = users.findActiveById(t.getUserId()).orElseThrow(() -> ApiException.notFound("user"));
        userService.resetPassword(u.getId(), newPassword);
        t.setUsedAt(Instant.now());
    }
}
