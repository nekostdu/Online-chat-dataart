package com.dataart.chat.message;

import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatMember;
import com.dataart.chat.chat.ChatMemberRepository;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.friend.FriendService;
import com.dataart.chat.message.MessageDtos.MessageDto;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageService {

    private final MessageRepository messages;
    private final AttachmentRepository attachments;
    private final ChatService chatService;
    private final ChatMemberRepository members;
    private final FriendService friends;
    private final MessageMapper mapper;
    private final int maxTextChars;

    public MessageService(MessageRepository messages,
                          AttachmentRepository attachments,
                          ChatService chatService,
                          ChatMemberRepository members,
                          FriendService friends,
                          MessageMapper mapper,
                          @Value("${chat.max-message-chars:3072}") int maxTextChars) {
        this.messages = messages;
        this.attachments = attachments;
        this.chatService = chatService;
        this.members = members;
        this.friends = friends;
        this.mapper = mapper;
        this.maxTextChars = maxTextChars;
    }

    @Transactional
    public MessageDto send(Long chatId, Long authorId, String text, Long replyToId, List<Long> attachmentIds) {
        Chat c = chatService.requireActive(chatId);
        ChatMember me = chatService.requireMember(c, authorId);
        enforceSendRules(c, authorId);

        if (text != null && text.length() > maxTextChars) {
            throw ApiException.badRequest("message too long (max " + maxTextChars + " chars)");
        }
        boolean hasText = text != null && !text.isBlank();
        boolean hasAtt  = attachmentIds != null && !attachmentIds.isEmpty();
        if (!hasText && !hasAtt) throw ApiException.badRequest("empty message");

        if (replyToId != null) {
            Message parent = messages.findById(replyToId)
                .orElseThrow(() -> ApiException.badRequest("reply target not found"));
            if (!parent.getChatId().equals(chatId)) {
                throw ApiException.badRequest("reply target is in another chat");
            }
        }

        Message m = new Message();
        m.setChatId(chatId);
        m.setAuthorId(authorId);
        m.setText(hasText ? text : null);
        m.setReplyToId(replyToId);
        m = messages.save(m);

        if (hasAtt) {
            attachments.attachToMessage(attachmentIds, m.getId(), authorId);
        }

        return mapper.toDto(m);
    }

    @Transactional
    public MessageDto edit(Long messageId, Long actorId, String newText) {
        Message m = messages.findById(messageId)
            .orElseThrow(() -> ApiException.notFound("message"));
        if (m.isDeleted()) throw ApiException.badRequest("cannot edit deleted message");
        if (!actorId.equals(m.getAuthorId())) throw ApiException.forbidden("only author can edit");
        Chat c = chatService.requireActive(m.getChatId());
        chatService.requireMember(c, actorId);
        enforceSendRules(c, actorId);

        if (newText == null || newText.isBlank()) throw ApiException.badRequest("empty message");
        if (newText.length() > maxTextChars) throw ApiException.badRequest("message too long");
        m.setText(newText);
        m.setEditedAt(Instant.now());
        return mapper.toDto(m);
    }

    @Transactional
    public MessageDto delete(Long messageId, Long actorId) {
        Message m = messages.findById(messageId)
            .orElseThrow(() -> ApiException.notFound("message"));
        Chat c = chatService.requireActive(m.getChatId());
        ChatMember actor = chatService.requireMember(c, actorId);
        boolean isAuthor = actorId.equals(m.getAuthorId());
        boolean isAdmin  = c.isRoom() && actor.isAdmin();
        if (!isAuthor && !isAdmin) throw ApiException.forbidden("cannot delete this message");
        if (!m.isDeleted()) {
            m.setDeletedAt(Instant.now());
            m.setText(null);
        }
        return mapper.toDto(m);
    }

    @Transactional(readOnly = true)
    public List<MessageDto> page(Long chatId, Long viewerId, Long beforeId, int limit) {
        Chat c = chatService.requireActive(chatId);
        chatService.requireMember(c, viewerId);
        int n = Math.min(Math.max(limit, 1), 200);
        List<Message> list = messages.findPage(chatId, beforeId == null ? 0L : beforeId,
            PageRequest.of(0, n));
        // Return chronologically ascending so the frontend can just append.
        Collections.reverse(list);
        return mapper.toDtos(list);
    }

    /** Req 2.3.6 + 2.3.5 + 2.4.8. */
    private void enforceSendRules(Chat c, Long userId) {
        if (c.isDm()) {
            Long otherId = null;
            for (Long m : members.findUserIdsByChatId(c.getId())) {
                if (!m.equals(userId)) { otherId = m; break; }
            }
            if (otherId == null) throw ApiException.badRequest("invalid dm");
            // Check block first — blocking removes the friendship, so without this ordering
            // the user would always see the less-informative "not friends" message.
            if (friends.isBlocked(userId, otherId)) {
                throw ApiException.forbidden("messaging blocked");
            }
            if (!friends.areFriends(userId, otherId)) {
                throw ApiException.forbidden("you are not friends");
            }
        }
        // room membership + ban already enforced by requireMember and join/kick logic
    }
}
