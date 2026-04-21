package com.dataart.chat;

import static com.dataart.chat.HttpHelpers.auth;
import static com.dataart.chat.HttpHelpers.extractCookie;
import static com.dataart.chat.HttpHelpers.json;
import static com.dataart.chat.HttpHelpers.register;
import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.auth.SessionController.SessionDto;
import com.dataart.chat.user.UserDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** /api/sessions — list and revoke. Req 2.2.4. */
class SessionHttpIT extends AbstractIT {

    @Autowired TestRestTemplate rest;
    @Autowired TestDb db;

    @BeforeEach
    void clean() { db.wipe(); }

    @Test
    void listReturnsCurrentSessionAsCurrent() {
        String cookie = register(rest, "a@x.io", "alice", "pw12345678").cookie();

        ResponseEntity<List<SessionDto>> list = rest.exchange(
            "/api/sessions", HttpMethod.GET, auth(cookie),
            new ParameterizedTypeReference<List<SessionDto>>() {});
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(list.getBody()).hasSize(1);
        assertThat(list.getBody().get(0).current()).isTrue();
    }

    @Test
    void secondLoginShowsTwoSessionsAndRevokingOneDropsIt() {
        register(rest, "a@x.io", "alice", "pw12345678");

        // login again from another "device" → second session cookie
        ResponseEntity<UserDto> first = rest.postForEntity("/api/auth/login",
            json("{\"emailOrUsername\":\"alice\",\"password\":\"pw12345678\"}"), UserDto.class);
        ResponseEntity<UserDto> second = rest.postForEntity("/api/auth/login",
            json("{\"emailOrUsername\":\"alice\",\"password\":\"pw12345678\"}"), UserDto.class);
        String cookieA = extractCookie(first);
        String cookieB = extractCookie(second);

        ResponseEntity<List<SessionDto>> listed = rest.exchange(
            "/api/sessions", HttpMethod.GET, auth(cookieA),
            new ParameterizedTypeReference<List<SessionDto>>() {});
        assertThat(listed.getBody().size()).isGreaterThanOrEqualTo(2);

        // find the non-current one, revoke it via cookieA
        Long otherId = listed.getBody().stream()
            .filter(s -> !s.current())
            .map(SessionDto::id)
            .findFirst().orElseThrow();
        ResponseEntity<String> revoke = rest.exchange(
            "/api/sessions/" + otherId, HttpMethod.DELETE, auth(cookieA), String.class);
        assertThat(revoke.getStatusCode()).isEqualTo(HttpStatus.OK);

        // the revoked cookie no longer authenticates
        ResponseEntity<String> me = rest.exchange(
            "/api/auth/me", HttpMethod.GET, auth(cookieB), String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void cannotRevokeSomeoneElsesSession() {
        String alice = register(rest, "a@x.io", "alice", "pw12345678").cookie();
        String bob   = register(rest, "b@x.io", "bob",   "pw12345678").cookie();

        Long aliceSessionId = rest.exchange(
            "/api/sessions", HttpMethod.GET, auth(alice),
            new ParameterizedTypeReference<List<SessionDto>>() {}).getBody().get(0).id();

        ResponseEntity<String> attempt = rest.exchange(
            "/api/sessions/" + aliceSessionId, HttpMethod.DELETE, auth(bob), String.class);
        // service returns {ok=false} for not-your-session; endpoint itself returns 200
        assertThat(attempt.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(attempt.getBody()).contains("\"ok\":false");

        // alice's session still works
        ResponseEntity<String> me = rest.exchange(
            "/api/auth/me", HttpMethod.GET, auth(alice), String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
