package com.dataart.chat.auth;

import com.dataart.chat.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

    private CurrentUser() {}

    public static UserPrincipal get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal p)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "not authenticated");
        }
        return p;
    }

    public static Long id() {
        return get().getUserId();
    }
}
