package com.dataart.chat.presence;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * In-memory presence tracking for single-instance deployment.
 * Req 2.2: online/AFK/offline with 60s AFK threshold, multi-tab counting.
 */
@Service
public class PresenceService {

    public static final Duration AFK_THRESHOLD = Duration.ofSeconds(60);

    private final SimpMessagingTemplate stomp;

    /** userId -> active WebSocket session ids (one per tab). */
    private final Map<Long, Set<String>> activeSessions = new ConcurrentHashMap<>();
    /** userId -> last activity timestamp across any tab. */
    private final Map<Long, Instant>    lastActivity    = new ConcurrentHashMap<>();
    /** userId -> last published state, used to debounce broadcasts. */
    private final Map<Long, Presence>   lastPublished   = new ConcurrentHashMap<>();

    public PresenceService(SimpMessagingTemplate stomp) {
        this.stomp = stomp;
    }

    public void onConnect(Long userId, String sessionId) {
        activeSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        lastActivity.put(userId, Instant.now());
        publishIfChanged(userId);
    }

    public void onDisconnect(Long userId, String sessionId) {
        Set<String> sessions = activeSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) activeSessions.remove(userId);
        }
        publishIfChanged(userId);
    }

    public void onActivity(Long userId) {
        lastActivity.put(userId, Instant.now());
        publishIfChanged(userId);
    }

    public Presence presenceOf(Long userId) {
        Set<String> sessions = activeSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) return Presence.OFFLINE;
        Instant last = lastActivity.getOrDefault(userId, Instant.EPOCH);
        if (Duration.between(last, Instant.now()).compareTo(AFK_THRESHOLD) >= 0) {
            return Presence.AFK;
        }
        return Presence.ONLINE;
    }

    /** Scan every 10s to tick users into/out of AFK. */
    @Scheduled(fixedDelay = 10_000L)
    public void tick() {
        for (Long userId : activeSessions.keySet()) {
            publishIfChanged(userId);
        }
        // Also scan users whose last session just dropped (none in activeSessions, but lastPublished not OFFLINE).
        for (Map.Entry<Long, Presence> e : lastPublished.entrySet()) {
            if (!activeSessions.containsKey(e.getKey()) && e.getValue() != Presence.OFFLINE) {
                publishIfChanged(e.getKey());
            }
        }
    }

    private void publishIfChanged(Long userId) {
        Presence now = presenceOf(userId);
        Presence prev = lastPublished.get(userId);
        if (now == prev) return;
        lastPublished.put(userId, now);
        stomp.convertAndSend("/topic/presence/" + userId, Map.of(
            "userId", userId,
            "presence", now.name().toLowerCase()));
    }
}
