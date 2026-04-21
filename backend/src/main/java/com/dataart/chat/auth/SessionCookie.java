package com.dataart.chat.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public final class SessionCookie {

    public static final String NAME = "CHATSESSION";
    /** 30 days — matches SessionService.INACTIVITY_TTL. */
    public static final int MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

    private SessionCookie() {}

    public static String read(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (NAME.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    public static void write(HttpServletResponse res, String value) {
        // Build header manually to include SameSite, which the Cookie API doesn't support.
        StringBuilder sb = new StringBuilder();
        sb.append(NAME).append('=').append(value);
        sb.append("; Path=/");
        sb.append("; Max-Age=").append(MAX_AGE_SECONDS);
        sb.append("; HttpOnly");
        sb.append("; SameSite=Lax");
        res.addHeader("Set-Cookie", sb.toString());
    }

    public static void clear(HttpServletResponse res) {
        res.addHeader("Set-Cookie",
            NAME + "=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    }
}
