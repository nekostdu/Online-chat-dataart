package com.dataart.chat.presence;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.friend.FriendService;
import com.dataart.chat.friend.Friendship;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final PresenceService presence;
    private final FriendService friends;

    public PresenceController(PresenceService presence, FriendService friends) {
        this.presence = presence;
        this.friends = friends;
    }

    /** Returns presence for all friends — used for initial bootstrap after login. */
    @GetMapping("/friends")
    public Map<Long, String> friendsPresence() {
        Long me = CurrentUser.id();
        List<Long> ids = new ArrayList<>();
        for (Friendship f : friends.listAccepted(me)) {
            ids.add(f.getRequesterId().equals(me) ? f.getAddresseeId() : f.getRequesterId());
        }
        Map<Long, String> out = new HashMap<>();
        for (Long id : ids) {
            out.put(id, presence.presenceOf(id).name().toLowerCase());
        }
        return out;
    }

    /** Batch presence lookup for arbitrary userIds — used for room members / DM peers. */
    @GetMapping
    public Map<Long, String> presenceFor(@RequestParam("ids") List<Long> ids) {
        Map<Long, String> out = new HashMap<>();
        // Cap the request size so a bogus call can't sweep every user id.
        int limit = Math.min(ids.size(), 200);
        for (int i = 0; i < limit; i++) {
            Long id = ids.get(i);
            if (id != null) out.put(id, presence.presenceOf(id).name().toLowerCase());
        }
        return out;
    }
}
