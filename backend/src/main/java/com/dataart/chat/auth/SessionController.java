package com.dataart.chat.auth;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessions;

    public SessionController(SessionService sessions) {
        this.sessions = sessions;
    }

    public record SessionDto(
        Long id,
        String userAgent,
        String ip,
        Instant createdAt,
        Instant lastSeenAt,
        boolean current) {}

    @GetMapping
    public List<SessionDto> list() {
        UserPrincipal p = CurrentUser.get();
        return sessions.listActiveForUser(p.getUserId()).stream()
            .map(s -> new SessionDto(
                s.getId(),
                s.getUserAgent(),
                s.getIp(),
                s.getCreatedAt(),
                s.getLastSeenAt(),
                s.getId().equals(p.getSessionId())))
            .toList();
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> revoke(@PathVariable Long id) {
        boolean ok = sessions.revokeForUser(id, CurrentUser.id());
        return Map.of("ok", ok);
    }
}
