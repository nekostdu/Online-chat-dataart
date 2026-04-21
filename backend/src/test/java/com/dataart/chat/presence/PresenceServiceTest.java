package com.dataart.chat.presence;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class PresenceServiceTest {

    @Test
    void offlineWhenNoSessions() {
        PresenceService p = new PresenceService(mock(SimpMessagingTemplate.class));
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.OFFLINE);
    }

    @Test
    void onlineOnConnectThenAfkAfterThreshold() throws Exception {
        PresenceService p = new PresenceService(mock(SimpMessagingTemplate.class));
        p.onConnect(1L, "s1");
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.ONLINE);

        // rewind last-activity past the AFK window
        setLastActivity(p, 1L, Instant.now().minusSeconds(120));
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.AFK);

        p.onActivity(1L);
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.ONLINE);
    }

    @Test
    void multiTabRequiresAllSessionsToClose() {
        PresenceService p = new PresenceService(mock(SimpMessagingTemplate.class));
        p.onConnect(1L, "tab-a");
        p.onConnect(1L, "tab-b");
        p.onDisconnect(1L, "tab-a");
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.ONLINE);
        p.onDisconnect(1L, "tab-b");
        assertThat(p.presenceOf(1L)).isEqualTo(Presence.OFFLINE);
    }

    @SuppressWarnings("unchecked")
    private static void setLastActivity(PresenceService svc, Long userId, Instant when) throws Exception {
        Field f = PresenceService.class.getDeclaredField("lastActivity");
        f.setAccessible(true);
        Map<Long, Instant> map = (Map<Long, Instant>) f.get(svc);
        map.put(userId, when);
    }
}
