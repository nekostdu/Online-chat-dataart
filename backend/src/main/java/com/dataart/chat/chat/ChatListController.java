package com.dataart.chat.chat;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.chat.ChatDtos.ChatSummary;
import com.dataart.chat.common.ApiException;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatListController {

    private final ChatQueryService queries;
    private final ChatService chatService;
    private final ChatMemberRepository members;

    public ChatListController(ChatQueryService queries, ChatService chatService, ChatMemberRepository members) {
        this.queries = queries;
        this.chatService = chatService;
        this.members = members;
    }

    public record DmRequest(@NotNull Long userId) {}

    @GetMapping("/chats")
    public List<ChatSummary> myChats() {
        return queries.myChats(CurrentUser.id());
    }

    @PostMapping("/dms")
    public ChatSummary openDm(@RequestBody DmRequest req) {
        if (req == null || req.userId() == null) throw ApiException.badRequest("userId required");
        Chat c = chatService.openDm(CurrentUser.id(), req.userId());
        // Return a summary of the created/open DM.
        for (ChatSummary s : queries.myChats(CurrentUser.id())) {
            if (s.id().equals(c.getId())) return s;
        }
        return new ChatSummary(c.getId(), c.getType(), null, null, null, null,
            members.countByChatId(c.getId()), 0, null, null);
    }
}
