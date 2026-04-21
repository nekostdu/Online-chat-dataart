package com.dataart.chat;

import static com.dataart.chat.HttpHelpers.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.chat.ChatDtos.RoomSummary;
import com.dataart.chat.message.MessageDtos.MessageDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** HTTP-level coverage for /api/chats/{id}/messages and /api/messages/{id}. */
class MessageHttpIT extends AbstractIT {

    @Autowired TestRestTemplate rest;
    @Autowired TestDb db;

    @BeforeEach
    void clean() { db.wipe(); }

    @Test
    void sendReadPageAndDeleteInRoom() {
        var alice = register(rest, "a@x.io", "alice", "pw12345678");
        var bob   = register(rest, "b@x.io", "bob",   "pw12345678");

        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"general\",\"description\":\"\",\"visibility\":\"public\"}",
            alice.cookie(), RoomSummary.class).getBody().id();
        post(rest, "/api/rooms/" + roomId + "/join", "", bob.cookie(), String.class);

        // send 3 messages from alice
        for (int i = 0; i < 3; i++) {
            ResponseEntity<MessageDto> r = post(rest,
                "/api/chats/" + roomId + "/messages",
                "{\"text\":\"m" + i + "\"}", alice.cookie(), MessageDto.class);
            assertThat(r.getStatusCode()).isEqualTo(HttpStatus.OK);
        }

        // bob reads history
        ResponseEntity<List<MessageDto>> page = rest.exchange(
            "/api/chats/" + roomId + "/messages", HttpMethod.GET, auth(bob.cookie()),
            new ParameterizedTypeReference<List<MessageDto>>() {});
        assertThat(page.getBody()).hasSize(3);
        assertThat(page.getBody().get(0).text()).isEqualTo("m0"); // chronological

        // bob marks read
        assertThat(post(rest, "/api/chats/" + roomId + "/read", "", bob.cookie(), String.class)
            .getStatusCode()).isEqualTo(HttpStatus.OK);

        // alice deletes her own message
        Long firstMsgId = page.getBody().get(0).id();
        ResponseEntity<MessageDto> del = rest.exchange(
            "/api/messages/" + firstMsgId, HttpMethod.DELETE, auth(alice.cookie()), MessageDto.class);
        assertThat(del.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(del.getBody().deletedAt()).isNotNull();
    }

    @Test
    void nonMemberCannotAccessMessages() {
        var alice = register(rest, "a@x.io", "alice", "pw12345678");
        var bob   = register(rest, "b@x.io", "bob",   "pw12345678");

        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"private-ish\",\"description\":\"\",\"visibility\":\"public\"}",
            alice.cookie(), RoomSummary.class).getBody().id();

        ResponseEntity<String> forbidden = rest.exchange(
            "/api/chats/" + roomId + "/messages", HttpMethod.GET, auth(bob.cookie()), String.class);
        assertThat(forbidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void editRejectsOtherUsersMessage() throws Exception {
        var alice = register(rest, "a@x.io", "alice", "pw12345678");
        var bob   = register(rest, "b@x.io", "bob",   "pw12345678");

        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"edit-room\",\"description\":\"\",\"visibility\":\"public\"}",
            alice.cookie(), RoomSummary.class).getBody().id();
        post(rest, "/api/rooms/" + roomId + "/join", "", bob.cookie(), String.class);

        Long msgId = post(rest, "/api/chats/" + roomId + "/messages",
            "{\"text\":\"by alice\"}", alice.cookie(), MessageDto.class).getBody().id();

        // HttpURLConnection (TestRestTemplate's default factory) doesn't support PATCH —
        // use java.net.http.HttpClient directly.
        java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
        java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
            .uri(java.net.URI.create(rest.getRootUri() + "/api/messages/" + msgId))
            .header("Content-Type", "application/json")
            .header("Cookie", bob.cookie())
            .method("PATCH", java.net.http.HttpRequest.BodyPublishers.ofString("{\"text\":\"hijack\"}"))
            .build();
        java.net.http.HttpResponse<String> res =
            client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
        assertThat(res.statusCode()).isEqualTo(HttpStatus.FORBIDDEN.value());
    }

    @Test
    void cursorPaginationReturnsOlderPage() {
        var alice = register(rest, "a@x.io", "alice", "pw12345678");
        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"big\",\"description\":\"\",\"visibility\":\"public\"}",
            alice.cookie(), RoomSummary.class).getBody().id();

        for (int i = 0; i < 12; i++) {
            post(rest, "/api/chats/" + roomId + "/messages",
                "{\"text\":\"m" + i + "\"}", alice.cookie(), MessageDto.class);
        }

        ResponseEntity<List<MessageDto>> first = rest.exchange(
            "/api/chats/" + roomId + "/messages?limit=5", HttpMethod.GET, auth(alice.cookie()),
            new ParameterizedTypeReference<List<MessageDto>>() {});
        assertThat(first.getBody()).hasSize(5);
        Long before = first.getBody().get(0).id();

        ResponseEntity<List<MessageDto>> older = rest.exchange(
            "/api/chats/" + roomId + "/messages?before=" + before + "&limit=5",
            HttpMethod.GET, auth(alice.cookie()),
            new ParameterizedTypeReference<List<MessageDto>>() {});
        assertThat(older.getBody()).hasSize(5);
        // All ids strictly less than the "before" cursor
        assertThat(older.getBody()).allMatch(m -> m.id() < before);
    }
}
