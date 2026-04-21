package com.dataart.chat.chat;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.chat.ChatDtos.BanDto;
import com.dataart.chat.chat.ChatDtos.MemberDto;
import com.dataart.chat.chat.ChatDtos.RoomSummary;
import com.dataart.chat.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final ChatService chatService;
    private final RoomMembershipService membership;
    private final RoomInvitationService invitationService;
    private final ChatQueryService queries;
    private final ChatMemberRepository members;

    public RoomController(ChatService chatService,
                          RoomMembershipService membership,
                          RoomInvitationService invitationService,
                          ChatQueryService queries,
                          ChatMemberRepository members) {
        this.chatService = chatService;
        this.membership = membership;
        this.invitationService = invitationService;
        this.queries = queries;
        this.members = members;
    }

    public record CreateRoomRequest(
        @NotBlank @Size(min = 3, max = 64) String name,
        @Size(max = 500) String description,
        @NotBlank String visibility) {}

    public record UpdateRoomRequest(
        @Size(min = 3, max = 64) String name,
        @Size(max = 500) String description,
        String visibility) {}

    public record InviteRequest(Long userId, @Size(max = 32) String username) {}

    @GetMapping("/public")
    public List<RoomSummary> publicCatalog(@RequestParam(value = "q", defaultValue = "") String q,
                                           @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return queries.publicCatalog(q, limit);
    }

    @PostMapping
    public RoomSummary create(@RequestBody @Valid CreateRoomRequest r) {
        Chat c = chatService.createRoom(CurrentUser.id(), r.name(), r.description(), r.visibility());
        return new RoomSummary(c.getId(), c.getName(), c.getDescription(), c.getVisibility(), c.getOwnerId(), 1);
    }

    @GetMapping("/{id}")
    public RoomSummary get(@PathVariable Long id) {
        Chat c = chatService.requireActiveRoom(id);
        if (!c.isPublic()) chatService.requireMember(c, CurrentUser.id());
        return new RoomSummary(c.getId(), c.getName(), c.getDescription(), c.getVisibility(),
            c.getOwnerId(), members.countByChatId(c.getId()));
    }

    @PatchMapping("/{id}")
    public RoomSummary update(@PathVariable Long id, @RequestBody UpdateRoomRequest r) {
        chatService.updateRoom(id, CurrentUser.id(), r.name(), r.description(), r.visibility());
        Chat c = chatService.requireActiveRoom(id);
        return new RoomSummary(c.getId(), c.getName(), c.getDescription(), c.getVisibility(),
            c.getOwnerId(), members.countByChatId(c.getId()));
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        chatService.deleteRoom(id, CurrentUser.id());
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/join")
    public Map<String, Object> join(@PathVariable Long id) {
        membership.joinPublicRoom(id, CurrentUser.id());
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/leave")
    public Map<String, Object> leave(@PathVariable Long id) {
        membership.leaveRoom(id, CurrentUser.id());
        return Map.of("ok", true);
    }

    @GetMapping("/{id}/members")
    public List<MemberDto> membersOf(@PathVariable Long id,
                                     @RequestParam(value = "page", defaultValue = "0")  int page,
                                     @RequestParam(value = "size", defaultValue = "100") int size) {
        return queries.members(id, CurrentUser.id(), page, size);
    }

    @PostMapping("/{id}/members/{userId}/admin")
    public Map<String, Object> makeAdmin(@PathVariable Long id, @PathVariable Long userId) {
        membership.makeAdmin(id, CurrentUser.id(), userId);
        return Map.of("ok", true);
    }

    @DeleteMapping("/{id}/members/{userId}/admin")
    public Map<String, Object> removeAdmin(@PathVariable Long id, @PathVariable Long userId) {
        membership.removeAdmin(id, CurrentUser.id(), userId);
        return Map.of("ok", true);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public Map<String, Object> kick(@PathVariable Long id, @PathVariable Long userId) {
        membership.kickMember(id, CurrentUser.id(), userId);
        return Map.of("ok", true);
    }

    @GetMapping("/{id}/bans")
    public List<BanDto> bans(@PathVariable Long id) {
        return queries.bans(id, CurrentUser.id());
    }

    @DeleteMapping("/{id}/bans/{userId}")
    public Map<String, Object> unban(@PathVariable Long id, @PathVariable Long userId) {
        membership.unban(id, CurrentUser.id(), userId);
        return Map.of("ok", true);
    }

    @PostMapping("/{id}/invitations")
    public Map<String, Object> invite(@PathVariable Long id, @RequestBody InviteRequest req) {
        Long target = req.userId();
        if (target == null && req.username() != null && !req.username().isBlank()) {
            target = chatService.lookupUserByUsername(req.username()).getId();
        }
        if (target == null) throw ApiException.badRequest("userId or username required");
        ChatInvitation inv = invitationService.invite(id, CurrentUser.id(), target);
        return Map.of("ok", true, "invitationId", inv.getId());
    }
}
