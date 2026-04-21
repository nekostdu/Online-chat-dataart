package com.dataart.chat.auth;

import com.dataart.chat.user.User;
import java.security.Principal;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Wraps our User + active Session for SecurityContext and STOMP Principal routing. */
public class UserPrincipal implements UserDetails, Principal {

    private static final List<GrantedAuthority> ROLE_USER =
        List.of(new SimpleGrantedAuthority("ROLE_USER"));

    private final Long userId;
    private final String username;
    private final Long sessionId;

    public UserPrincipal(Long userId, String username, Long sessionId) {
        this.userId = userId;
        this.username = username;
        this.sessionId = sessionId;
    }

    public static UserPrincipal of(User user, Session session) {
        return new UserPrincipal(user.getId(), user.getUsername(), session.getId());
    }

    public Long getUserId()    { return userId; }
    public Long getSessionId() { return sessionId; }

    /** Principal.getName() — used as STOMP user destination key. We use user id. */
    @Override
    public String getName() { return String.valueOf(userId); }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return ROLE_USER; }
    @Override public String getPassword() { return ""; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}
