package com.dataart.chat.friend;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserDto;
import com.dataart.chat.user.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {

    private final FriendService friends;
    private final UserRepository users;

    public BlockController(FriendService friends, UserRepository users) {
        this.friends = friends;
        this.users = users;
    }

    public record BlockedDto(UserDto user, Instant since) {}

    @GetMapping
    public List<BlockedDto> list() {
        Long me = CurrentUser.id();
        List<UserBlock> list = friends.listBlocked(me);
        List<Long> ids = list.stream().map(UserBlock::getBlockedId).toList();
        Map<Long, User> byId = new HashMap<>();
        for (User u : users.findActiveByIds(ids)) byId.put(u.getId(), u);
        List<BlockedDto> out = new ArrayList<>();
        for (UserBlock b : list) {
            User u = byId.get(b.getBlockedId());
            if (u == null) continue;
            out.add(new BlockedDto(UserDto.publicOf(u), b.getCreatedAt()));
        }
        return out;
    }

    @PostMapping("/{userId}")
    public Map<String, Object> block(@PathVariable Long userId) {
        friends.block(CurrentUser.id(), userId);
        return Map.of("ok", true);
    }

    @DeleteMapping("/{userId}")
    public Map<String, Object> unblock(@PathVariable Long userId) {
        friends.unblock(CurrentUser.id(), userId);
        return Map.of("ok", true);
    }
}
