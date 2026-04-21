package com.dataart.chat.presence;

import com.dataart.chat.auth.UserPrincipal;
import java.security.Principal;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

/**
 * STOMP handler for client-side activity heartbeat.
 * The browser sends an empty /app/activity frame every ~20s (or on input events).
 */
@Controller
public class ActivityController {

    private final PresenceService presence;

    public ActivityController(PresenceService presence) {
        this.presence = presence;
    }

    @MessageMapping("/activity")
    public void activity(Principal p) {
        if (p instanceof UserPrincipal up) {
            presence.onActivity(up.getUserId());
        }
    }
}
