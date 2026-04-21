package com.dataart.chat.config;

import com.dataart.chat.auth.SessionCookie;
import com.dataart.chat.auth.SessionService;
import com.dataart.chat.auth.UserPrincipal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.lang.Nullable;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final SessionService sessions;

    public WebSocketConfig(@Autowired SessionService sessions) {
        this.sessions = sessions;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .setHandshakeHandler(new SessionHandshakeHandler())
            .addInterceptors(new CookieHandshakeInterceptor());
    }

    /** Reads the session cookie in the handshake and stashes the authenticated principal. */
    private class CookieHandshakeInterceptor implements HandshakeInterceptor {
        @Override
        public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                       WebSocketHandler handler, Map<String, Object> attrs) {
            UserPrincipal p = resolvePrincipal(req);
            if (p == null) return false;           // reject unauthenticated WS
            attrs.put("principal", p);
            return true;
        }

        @Override
        public void afterHandshake(ServerHttpRequest req, ServerHttpResponse res,
                                   WebSocketHandler handler, Exception e) {}
    }

    /** Reads the principal previously stored by the interceptor and attaches it to the session. */
    private static class SessionHandshakeHandler extends DefaultHandshakeHandler {
        @Override
        @Nullable
        protected Principal determineUser(ServerHttpRequest req,
                                          WebSocketHandler wsHandler,
                                          Map<String, Object> attrs) {
            return (Principal) attrs.get("principal");
        }
    }

    private UserPrincipal resolvePrincipal(ServerHttpRequest req) {
        if (!(req instanceof ServletServerHttpRequest servletReq)) return null;
        String token = SessionCookie.read(servletReq.getServletRequest());
        if (token != null) {
            return sessions.resolve(token).orElse(null);
        }
        // Fallback: some clients pass the token in the "CHATSESSION" query param.
        HttpHeaders headers = req.getHeaders();
        List<String> cookies = headers.get(HttpHeaders.COOKIE);
        if (cookies != null) {
            for (String cookie : cookies) {
                for (String piece : cookie.split(";")) {
                    String[] kv = piece.trim().split("=", 2);
                    if (kv.length == 2 && SessionCookie.NAME.equals(kv[0])) {
                        return sessions.resolve(kv[1]).orElse(null);
                    }
                }
            }
        }
        return null;
    }
}
