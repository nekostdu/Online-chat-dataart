package com.dataart.chat.friend;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserDto;
import com.dataart.chat.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friends;
    private final UserRepository users;

    public FriendController(FriendService friends, UserRepository users) {
        this.friends = friends;
        this.users = users;
    }

    public record SendRequestDto(
        Long userId,
        String username,
        @Size(max = 500) String message) {}

    public record FriendDto(
        UserDto user,
        Instant since) {}

    public record PendingDto(
        Long requesterId,
        Long addresseeId,
        UserDto user,            // "the other side" from viewer's perspective
        String direction,        // "incoming" or "outgoing"
        String message,
        Instant createdAt) {}

    @GetMapping
    public List<FriendDto> list() {
        Long me = CurrentUser.id();
        List<Friendship> all = friends.listAccepted(me);
        List<Long> ids = new ArrayList<>();
        for (Friendship f : all) {
            ids.add(f.getRequesterId().equals(me) ? f.getAddresseeId() : f.getRequesterId());
        }
        Map<Long, User> byId = new HashMap<>();
        for (User u : users.findActiveByIds(ids)) byId.put(u.getId(), u);
        List<FriendDto> out = new ArrayList<>();
        for (Friendship f : all) {
            Long otherId = f.getRequesterId().equals(me) ? f.getAddresseeId() : f.getRequesterId();
            User u = byId.get(otherId);
            if (u == null) continue;
            out.add(new FriendDto(UserDto.publicOf(u), f.getConfirmedAt() != null ? f.getConfirmedAt() : f.getCreatedAt()));
        }
        return out;
    }

    @GetMapping("/pending")
    public List<PendingDto> pending() {
        Long me = CurrentUser.id();
        List<PendingDto> out = new ArrayList<>();
        List<Friendship> incoming = friends.listIncomingPending(me);
        List<Friendship> outgoing = friends.listOutgoingPending(me);
        List<Long> ids = new ArrayList<>();
        for (Friendship f : incoming) ids.add(f.getRequesterId());
        for (Friendship f : outgoing) ids.add(f.getAddresseeId());
        Map<Long, User> byId = new HashMap<>();
        for (User u : users.findActiveByIds(ids)) byId.put(u.getId(), u);
        for (Friendship f : incoming) {
            User u = byId.get(f.getRequesterId());
            if (u == null) continue;
            out.add(new PendingDto(f.getRequesterId(), f.getAddresseeId(),
                UserDto.publicOf(u), "incoming", f.getMessage(), f.getCreatedAt()));
        }
        for (Friendship f : outgoing) {
            User u = byId.get(f.getAddresseeId());
            if (u == null) continue;
            out.add(new PendingDto(f.getRequesterId(), f.getAddresseeId(),
                UserDto.publicOf(u), "outgoing", f.getMessage(), f.getCreatedAt()));
        }
        return out;
    }

    @PostMapping("/requests")
    public Map<String, Object> send(@RequestBody @Valid SendRequestDto req) {
        Long me = CurrentUser.id();
        Friendship f;
        if (req.userId() != null) {
            f = friends.sendRequest(me, req.userId(), req.message());
        } else if (req.username() != null && !req.username().isBlank()) {
            f = friends.sendRequestByUsername(me, req.username(), req.message());
        } else {
            throw ApiException.badRequest("userId or username required");
        }
        return Map.of("ok", true, "status", f.getStatus());
    }

    @PostMapping("/requests/accept/{requesterId}")
    public Map<String, Object> accept(@PathVariable Long requesterId) {
        friends.accept(requesterId, CurrentUser.id(), CurrentUser.id());
        return Map.of("ok", true);
    }

    @PostMapping("/requests/decline/{requesterId}")
    public Map<String, Object> decline(@PathVariable Long requesterId) {
        friends.decline(requesterId, CurrentUser.id(), CurrentUser.id());
        return Map.of("ok", true);
    }

    @DeleteMapping("/{userId}")
    public Map<String, Object> remove(@PathVariable Long userId) {
        friends.removeFriend(CurrentUser.id(), userId);
        return Map.of("ok", true);
    }
}
