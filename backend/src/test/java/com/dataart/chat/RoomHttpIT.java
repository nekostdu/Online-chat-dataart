package com.dataart.chat;

import static com.dataart.chat.HttpHelpers.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.chat.ChatDtos.MemberDto;
import com.dataart.chat.chat.ChatDtos.RoomSummary;
import com.dataart.chat.chat.ChatRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** HTTP-level coverage for /api/rooms, /api/chats, /api/invitations. */
class RoomHttpIT extends AbstractIT {

    @Autowired TestRestTemplate rest;
    @Autowired TestDb db;
    @Autowired ChatRepository chats;

    @BeforeEach
    void clean() { db.wipe(); }

    @Test
    void createPublicRoomAppearsInCatalogAndOtherCanJoin() {
        String alice = register(rest, "a@x.io", "alice", "pw12345678").cookie();
        String bob   = register(rest, "b@x.io", "bob",   "pw12345678").cookie();

        ResponseEntity<RoomSummary> create = post(rest, "/api/rooms",
            "{\"name\":\"general\",\"description\":\"all-hands\",\"visibility\":\"public\"}",
            alice, RoomSummary.class);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        Long roomId = create.getBody().id();

        // bob sees the room in the catalog
        ResponseEntity<List<RoomSummary>> list = rest.exchange(
            "/api/rooms/public", HttpMethod.GET, auth(bob),
            new ParameterizedTypeReference<List<RoomSummary>>() {});
        assertThat(list.getBody()).extracting(RoomSummary::name).contains("general");

        // bob joins and becomes a member
        assertThat(post(rest, "/api/rooms/" + roomId + "/join", "", bob, String.class)
            .getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<List<MemberDto>> members = rest.exchange(
            "/api/rooms/" + roomId + "/members", HttpMethod.GET, auth(bob),
            new ParameterizedTypeReference<List<MemberDto>>() {});
        assertThat(members.getBody()).extracting(MemberDto::userId).hasSize(2);
    }

    @Test
    void privateRoomIsNotListedAndCannotBeJoinedFreely() {
        String alice = register(rest, "a@x.io", "alice", "pw12345678").cookie();
        String bob   = register(rest, "b@x.io", "bob",   "pw12345678").cookie();

        ResponseEntity<RoomSummary> create = post(rest, "/api/rooms",
            "{\"name\":\"vip\",\"description\":\"\",\"visibility\":\"private\"}",
            alice, RoomSummary.class);
        Long roomId = create.getBody().id();

        // catalog search doesn't return private rooms
        ResponseEntity<List<RoomSummary>> list = rest.exchange(
            "/api/rooms/public?q=vip", HttpMethod.GET, auth(bob),
            new ParameterizedTypeReference<List<RoomSummary>>() {});
        assertThat(list.getBody()).noneMatch(r -> r.name().equals("vip"));

        // direct join is forbidden
        ResponseEntity<String> join = post(rest, "/api/rooms/" + roomId + "/join", "", bob, String.class);
        assertThat(join.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void invitationFlowAcceptsAndAddsMember() {
        var alice = register(rest, "a@x.io", "alice", "pw12345678");
        var bob   = register(rest, "b@x.io", "bob",   "pw12345678");

        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"team\",\"description\":\"\",\"visibility\":\"private\"}",
            alice.cookie(), RoomSummary.class).getBody().id();

        assertThat(post(rest, "/api/rooms/" + roomId + "/invitations",
            "{\"username\":\"bob\"}", alice.cookie(), String.class)
            .getStatusCode()).isEqualTo(HttpStatus.OK);

        // bob sees invitation
        ResponseEntity<List<Object>> invs = rest.exchange(
            "/api/invitations/me", HttpMethod.GET, auth(bob.cookie()),
            new ParameterizedTypeReference<List<Object>>() {});
        assertThat(invs.getBody()).hasSize(1);

        // extract id and accept
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> inv = (java.util.Map<String, Object>) invs.getBody().get(0);
        Long invId = Long.valueOf(String.valueOf(inv.get("id")));
        assertThat(post(rest, "/api/invitations/" + invId + "/accept", "", bob.cookie(), String.class)
            .getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void ownerCanDeleteRoomAndItDisappearsFromCatalog() {
        String alice = register(rest, "a@x.io", "alice", "pw12345678").cookie();
        Long roomId = post(rest, "/api/rooms",
            "{\"name\":\"killme\",\"description\":\"\",\"visibility\":\"public\"}",
            alice, RoomSummary.class).getBody().id();

        assertThat(delete(rest, "/api/rooms/" + roomId, alice, String.class).getStatusCode())
            .isEqualTo(HttpStatus.OK);
        assertThat(chats.findActive(roomId)).isEmpty();
    }

    @Test
    void nonAuthenticatedRequestReturns401() {
        ResponseEntity<String> r = rest.getForEntity("/api/rooms/public", String.class);
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void creatingDuplicateNameReturns409() {
        String alice = register(rest, "a@x.io", "alice", "pw12345678").cookie();
        post(rest, "/api/rooms",
            "{\"name\":\"general\",\"description\":\"\",\"visibility\":\"public\"}",
            alice, RoomSummary.class);
        ResponseEntity<String> dup = post(rest, "/api/rooms",
            "{\"name\":\"GENERAL\",\"description\":\"\",\"visibility\":\"public\"}",
            alice, String.class);
        assertThat(dup.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
