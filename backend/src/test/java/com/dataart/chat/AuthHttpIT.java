package com.dataart.chat;

import com.dataart.chat.user.UserDto;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import static org.assertj.core.api.Assertions.assertThat;

/** End-to-end HTTP test for the auth cookie flow. */
class AuthHttpIT extends AbstractIT {

    @Autowired TestRestTemplate rest;
    @Autowired TestDb db;

    @BeforeEach
    void clean() {
        db.wipe();
        // Disable output-streaming so HttpURLConnection doesn't throw HttpRetryException
        // when a POST gets a 401 / 4xx response (it wants to "retry" which isn't allowed mid-stream).
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        rest.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    void registerSetsCookieAndMeWorks() {
        String body = "{\"email\":\"alice@x.io\",\"username\":\"alice\",\"password\":\"hunter2!@\"}";
        ResponseEntity<UserDto> reg = rest.postForEntity("/api/auth/register", json(body), UserDto.class);
        assertThat(reg.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(reg.getBody()).isNotNull();
        String cookie = extractCookie(reg);
        assertThat(cookie).isNotBlank();

        // /api/auth/me with cookie should succeed
        HttpHeaders h = new HttpHeaders();
        h.add(HttpHeaders.COOKIE, cookie);
        ResponseEntity<UserDto> me = rest.exchange("/api/auth/me", HttpMethod.GET,
            new HttpEntity<>(h), UserDto.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().username()).isEqualTo("alice");

        // without cookie — 401
        ResponseEntity<String> anon = rest.getForEntity("/api/auth/me", String.class);
        assertThat(anon.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void loginAndLogoutClearsSession() {
        rest.postForEntity("/api/auth/register",
            json("{\"email\":\"bob@x.io\",\"username\":\"bob\",\"password\":\"hunter2!@\"}"), UserDto.class);

        ResponseEntity<UserDto> login = rest.postForEntity("/api/auth/login",
            json("{\"emailOrUsername\":\"bob\",\"password\":\"hunter2!@\"}"), UserDto.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String cookie = extractCookie(login);

        // logout
        HttpHeaders h = new HttpHeaders();
        h.add(HttpHeaders.COOKIE, cookie);
        ResponseEntity<Map> out = rest.exchange("/api/auth/logout", HttpMethod.POST,
            new HttpEntity<>(h), Map.class);
        assertThat(out.getStatusCode()).isEqualTo(HttpStatus.OK);

        // old cookie should no longer authenticate
        ResponseEntity<String> me = rest.exchange("/api/auth/me", HttpMethod.GET,
            new HttpEntity<>(h), String.class);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void loginWithWrongPasswordReturns401() {
        rest.postForEntity("/api/auth/register",
            json("{\"email\":\"eve@x.io\",\"username\":\"eve\",\"password\":\"hunter2!@\"}"), UserDto.class);

        // Go direct: HttpURLConnection + 401 + streaming POST is a well-known footgun with
        // TestRestTemplate. We use Java 11's HttpClient instead for this one assertion.
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
            .uri(java.net.URI.create(rest.getRootUri() + "/api/auth/login"))
            .header("Content-Type", "application/json")
            .POST(java.net.http.HttpRequest.BodyPublishers.ofString(
                "{\"emailOrUsername\":\"eve\",\"password\":\"wrong\"}"))
            .build();
        java.net.http.HttpResponse<String> res;
        try {
            res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        assertThat(res.statusCode()).isEqualTo(401);
    }

    private static HttpEntity<String> json(String body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }

    private static String extractCookie(ResponseEntity<?> r) {
        List<String> cookies = r.getHeaders().get(HttpHeaders.SET_COOKIE);
        assertThat(cookies).isNotEmpty();
        // strip the attributes; keep only "CHATSESSION=value"
        return cookies.get(0).split(";")[0];
    }
}
