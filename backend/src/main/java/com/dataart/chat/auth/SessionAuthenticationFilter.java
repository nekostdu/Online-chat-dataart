package com.dataart.chat.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {

    private final SessionService sessions;

    public SessionAuthenticationFilter(SessionService sessions) {
        this.sessions = sessions;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String token = SessionCookie.read(req);
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            sessions.resolve(token).ifPresent(principal -> {
                Authentication auth = new UsernamePasswordAuthenticationToken(
                    principal, null, principal.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
                sessions.touch(principal.getSessionId());
            });
        }
        chain.doFilter(req, res);
    }
}
