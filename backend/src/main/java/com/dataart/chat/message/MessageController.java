package com.dataart.chat.message;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatMemberRepository;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.MessageDtos.MessageDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.Instant;
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
@RequestMapping("/api")
public class MessageController {

    private final MessageService service;
    private final MessageBroadcaster broadcaster;
    private final ChatService chatService;
    private final ChatMemberRepository members;
    private final MessageRepository messages;
    private final ReadReceiptRepository readReceipts;

    public MessageController(MessageService service,
                             MessageBroadcaster broadcaster,
                             ChatService chatService,
                             ChatMemberRepository members,
                             MessageRepository messages,
                             ReadReceiptRepository readReceipts) {
        this.service = service;
        this.broadcaster = broadcaster;
        this.chatService = chatService;
        this.members = members;
        this.messages = messages;
        this.readReceipts = readReceipts;
    }

    public record SendRequest(
        @Size(max = 3500) String text,
        Long replyToId,
        List<Long> attachmentIds) {}

    public record EditRequest(@Size(max = 3500) String text) {}

    public record ReadRequest(Long messageId) {}

    @GetMapping("/chats/{chatId}/messages")
    public List<MessageDto> page(@PathVariable Long chatId,
                                 @RequestParam(value = "before", required = false) Long before,
                                 @RequestParam(value = "limit",  defaultValue = "50") int limit) {
        return service.page(chatId, CurrentUser.id(), before, limit);
    }

    @PostMapping("/chats/{chatId}/messages")
    public MessageDto send(@PathVariable Long chatId, @RequestBody @Valid SendRequest r) {
        MessageDto dto = service.send(chatId, CurrentUser.id(), r.text(), r.replyToId(), r.attachmentIds());
        broadcaster.newMessage(dto);
        return dto;
    }

    @PatchMapping("/messages/{id}")
    public MessageDto edit(@PathVariable Long id, @RequestBody @Valid EditRequest r) {
        MessageDto dto = service.edit(id, CurrentUser.id(), r.text());
        broadcaster.updatedMessage(dto);
        return dto;
    }

    @DeleteMapping("/messages/{id}")
    public MessageDto delete(@PathVariable Long id) {
        MessageDto dto = service.delete(id, CurrentUser.id());
        broadcaster.updatedMessage(dto);
        return dto;
    }

    @PostMapping("/chats/{chatId}/read")
    public Map<String, Object> read(@PathVariable Long chatId, @RequestBody(required = false) ReadRequest r) {
        Long me = CurrentUser.id();
        Chat c = chatService.requireActive(chatId);
        chatService.requireMember(c, me);
        Long msgId = r != null ? r.messageId() : null;
        if (msgId == null) msgId = messages.lastId(chatId).orElse(null);

        ReadReceipt rr = readReceipts.findByChatIdAndUserId(chatId, me).orElseGet(() -> {
            ReadReceipt fresh = new ReadReceipt();
            fresh.setChatId(chatId);
            fresh.setUserId(me);
            return fresh;
        });
        rr.setLastReadMessageId(msgId);
        rr.setUpdatedAt(Instant.now());
        readReceipts.save(rr);
        broadcaster.readReceipt(chatId, me, msgId);
        return Map.of("ok", true, "lastReadMessageId", msgId == null ? 0L : msgId);
    }
}
