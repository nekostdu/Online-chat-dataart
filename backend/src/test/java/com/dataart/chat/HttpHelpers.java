package com.dataart.chat;

import com.dataart.chat.user.UserDto;
import java.util.List;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/** Utilities for HTTP-level integration tests. */
public final class HttpHelpers {
    private HttpHelpers() {}

    public record Registered(UserDto user, String cookie) {}

    public static Registered register(TestRestTemplate rest, String email, String username, String password) {
        String body = "{\"email\":\"" + email + "\",\"username\":\"" + username
            + "\",\"password\":\"" + password + "\"}";
        ResponseEntity<UserDto> r = rest.postForEntity("/api/auth/register", json(body), UserDto.class);
        if (!r.getStatusCode().is2xxSuccessful() || r.getBody() == null) {
            throw new IllegalStateException("register failed: " + r.getStatusCode());
        }
        return new Registered(r.getBody(), extractCookie(r));
    }

    public static HttpEntity<String> json(String body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }

    public static HttpEntity<String> json(String body, String cookie) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.add(HttpHeaders.COOKIE, cookie);
        return new HttpEntity<>(body, h);
    }

    public static HttpEntity<Void> auth(String cookie) {
        HttpHeaders h = new HttpHeaders();
        h.add(HttpHeaders.COOKIE, cookie);
        return new HttpEntity<>(h);
    }

    public static <T> ResponseEntity<T> get(TestRestTemplate rest, String url, String cookie, Class<T> type) {
        return rest.exchange(url, HttpMethod.GET, auth(cookie), type);
    }

    public static <T> ResponseEntity<T> post(TestRestTemplate rest, String url, String body, String cookie, Class<T> type) {
        return rest.exchange(url, HttpMethod.POST, json(body, cookie), type);
    }

    public static <T> ResponseEntity<T> delete(TestRestTemplate rest, String url, String cookie, Class<T> type) {
        return rest.exchange(url, HttpMethod.DELETE, auth(cookie), type);
    }

    public static String extractCookie(ResponseEntity<?> r) {
        List<String> cookies = r.getHeaders().get(HttpHeaders.SET_COOKIE);
        if (cookies == null || cookies.isEmpty()) throw new IllegalStateException("no Set-Cookie header");
        return cookies.get(0).split(";")[0];
    }
}
