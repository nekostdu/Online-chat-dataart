package com.dataart.chat.presence;

import com.dataart.chat.auth.UserPrincipal;
import java.security.Principal;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

    private final PresenceService presence;

    public WebSocketEventListener(PresenceService presence) {
        this.presence = presence;
    }

    @EventListener
    public void onConnected(SessionConnectedEvent e) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(e.getMessage());
        Long userId = resolveUserId(sha.getUser());
        if (userId != null && sha.getSessionId() != null) {
            presence.onConnect(userId, sha.getSessionId());
        }
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent e) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(e.getMessage());
        Long userId = resolveUserId(sha.getUser());
        if (userId != null && sha.getSessionId() != null) {
            presence.onDisconnect(userId, sha.getSessionId());
        }
    }

    private static Long resolveUserId(Principal p) {
        if (p instanceof UserPrincipal up) return up.getUserId();
        return null;
    }
}
