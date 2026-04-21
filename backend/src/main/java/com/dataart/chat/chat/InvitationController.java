package com.dataart.chat.chat;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.chat.ChatDtos.InvitationDto;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final RoomInvitationService invitationService;
    private final ChatQueryService queries;

    public InvitationController(RoomInvitationService invitationService, ChatQueryService queries) {
        this.invitationService = invitationService;
        this.queries = queries;
    }

    @GetMapping("/me")
    public List<InvitationDto> mine() {
        return queries.myInvitations(CurrentUser.id());
    }

    @PostMapping("/{id}/accept")
    public Map<String, Object> accept(@PathVariable Long id) {
        Chat c = invitationService.acceptInvitation(id, CurrentUser.id());
        return Map.of("ok", true, "chatId", c.getId());
    }

    @PostMapping("/{id}/decline")
    public Map<String, Object> decline(@PathVariable Long id) {
        invitationService.declineInvitation(id, CurrentUser.id());
        return Map.of("ok", true);
    }
}
