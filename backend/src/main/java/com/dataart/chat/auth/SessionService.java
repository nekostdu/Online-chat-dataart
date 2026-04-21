package com.dataart.chat.auth;

import com.dataart.chat.user.User;
import com.dataart.chat.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

    /** Drop sessions not seen for this long from the "active sessions" UI. */
    public static final Duration INACTIVITY_TTL = Duration.ofDays(30);

    private final SessionRepository sessions;
    private final UserRepository users;

    public SessionService(SessionRepository sessions, UserRepository users) {
        this.sessions = sessions;
        this.users = users;
    }

    /** Called on successful login; returns the raw token to drop in a cookie. */
    @Transactional
    public String createSession(User user, HttpServletRequest req) {
        String raw = Tokens.random();
        Session s = new Session();
        s.setUserId(user.getId());
        s.setTokenHash(Tokens.hash(raw));
        s.setUserAgent(truncate(req.getHeader("User-Agent"), 500));
        s.setIp(resolveIp(req));
        sessions.save(s);
        return raw;
    }

    @Transactional(readOnly = true)
    public Optional<UserPrincipal> resolve(String rawToken) {
        return sessions.findByTokenHash(Tokens.hash(rawToken))
            .filter(Session::isActive)
            .filter(s -> s.getLastSeenAt().isAfter(Instant.now().minus(INACTIVITY_TTL)))
            .flatMap(s -> users.findActiveById(s.getUserId())
                .map(u -> UserPrincipal.of(u, s)));
    }

    @Transactional
    public void touch(Long sessionId) {
        sessions.findById(sessionId).ifPresent(s -> {
            if (s.isActive()) s.setLastSeenAt(Instant.now());
        });
    }

    @Transactional
    public void revoke(Long sessionId) {
        sessions.findById(sessionId).ifPresent(s -> {
            if (s.isActive()) s.setRevokedAt(Instant.now());
        });
    }

    @Transactional
    public boolean revokeForUser(Long sessionId, Long userId) {
        return sessions.findById(sessionId)
            .filter(s -> s.getUserId().equals(userId))
            .filter(Session::isActive)
            .map(s -> { s.setRevokedAt(Instant.now()); return true; })
            .orElse(false);
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        sessions.revokeAllByUser(userId, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<Session> listActiveForUser(Long userId) {
        return sessions.findActiveByUser(userId);
    }

    private static String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
