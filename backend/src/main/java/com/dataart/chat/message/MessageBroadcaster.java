package com.dataart.chat.message;

import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatMemberRepository;
import com.dataart.chat.chat.ChatRepository;
import com.dataart.chat.message.MessageDtos.MessageDto;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/** Publishes chat events over STOMP. */
@Component
public class MessageBroadcaster {

    private final SimpMessagingTemplate stomp;
    private final ChatRepository chats;
    private final ChatMemberRepository members;

    public MessageBroadcaster(SimpMessagingTemplate stomp,
                              ChatRepository chats,
                              ChatMemberRepository members) {
        this.stomp = stomp;
        this.chats = chats;
        this.members = members;
    }

    public void newMessage(MessageDto dto) {
        Map<String, Object> event = Map.of("type", "message", "payload", dto);
        publish(dto.chatId(), event);
    }

    public void updatedMessage(MessageDto dto) {
        Map<String, Object> event = Map.of("type", "message.updated", "payload", dto);
        publish(dto.chatId(), event);
    }

    public void readReceipt(Long chatId, Long userId, Long lastReadMessageId) {
        Map<String, Object> event = Map.of(
            "type", "read",
            "chatId", chatId,
            "userId", userId,
            "lastReadMessageId", lastReadMessageId);
        publish(chatId, event);
    }

    /** Called after a room has been hard-deleted — use a wildcard topic the FE already subscribed to. */
    public void roomDeleted(Long chatId, java.util.List<Long> memberIds) {
        Map<String, Object> event = Map.of("type", "chat.deleted", "chatId", chatId);
        // The chat is gone — we can't load members via repos, callers pass them in.
        stomp.convertAndSend("/topic/chat/" + chatId, event);
        for (Long uid : memberIds) {
            stomp.convertAndSendToUser(String.valueOf(uid), "/queue/messages", event);
        }
    }

    /** Notifies an invited user so they see the invitation in their sidebar without a reload. */
    public void invitationSent(Long invitedUserId) {
        Map<String, Object> event = Map.of("type", "invitation.new");
        stomp.convertAndSendToUser(String.valueOf(invitedUserId), "/queue/messages", event);
    }

    /** Notifies both participants of a DM that a new chat was opened, so it shows up in the sidebar. */
    public void chatCreated(java.util.List<Long> memberIds) {
        Map<String, Object> event = Map.of("type", "chat.created");
        for (Long uid : memberIds) {
            stomp.convertAndSendToUser(String.valueOf(uid), "/queue/messages", event);
        }
    }

    /** Both users touched by accept / remove / block refresh their friends list + presence subscriptions. */
    public void friendsChanged(java.util.List<Long> userIds) {
        Map<String, Object> event = Map.of("type", "friends.changed");
        for (Long uid : userIds) {
            if (uid != null) stomp.convertAndSendToUser(String.valueOf(uid), "/queue/messages", event);
        }
    }

    private void publish(Long chatId, Map<String, Object> event) {
        Chat c = chats.findById(chatId).orElse(null);
        if (c == null) return;

        if (c.isRoom()) {
            // Public topic for the room — all current tabs/members can subscribe.
            stomp.convertAndSend("/topic/chat/" + chatId, event);
        } else {
            // DM — send personally to each participant.
            for (Long userId : members.findUserIdsByChatId(chatId)) {
                stomp.convertAndSendToUser(String.valueOf(userId), "/queue/messages", event);
            }
        }
    }
}
