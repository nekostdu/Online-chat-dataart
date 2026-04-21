package com.dataart.chat.message;

import com.dataart.chat.message.MessageDtos.AttachmentDto;
import com.dataart.chat.message.MessageDtos.MessageDto;
import com.dataart.chat.message.MessageDtos.MessagePreviewDto;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {

    private final UserRepository users;
    private final AttachmentRepository attachments;
    private final MessageRepository messages;

    public MessageMapper(UserRepository users, AttachmentRepository attachments, MessageRepository messages) {
        this.users = users;
        this.attachments = attachments;
        this.messages = messages;
    }

    public List<MessageDto> toDtos(Collection<Message> list) {
        if (list.isEmpty()) return List.of();

        // 1. gather user ids (authors) + reply-to message ids
        Set<Long> userIds = new HashSet<>();
        Set<Long> replyIds = new HashSet<>();
        List<Long> messageIds = new ArrayList<>(list.size());
        for (Message m : list) {
            if (m.getAuthorId()  != null) userIds.add(m.getAuthorId());
            if (m.getReplyToId() != null) replyIds.add(m.getReplyToId());
            messageIds.add(m.getId());
        }

        // 2. resolve replied-to messages and union their authors
        Map<Long, Message> replyMap = new HashMap<>();
        if (!replyIds.isEmpty()) {
            for (Message r : messages.findByIds(new ArrayList<>(replyIds))) {
                replyMap.put(r.getId(), r);
                if (r.getAuthorId() != null) userIds.add(r.getAuthorId());
            }
        }

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (User u : users.findActiveByIds(new ArrayList<>(userIds))) userMap.put(u.getId(), u);
        }

        // 3. attachments for all messages
        Map<Long, List<AttachmentDto>> attByMessage = new HashMap<>();
        List<Attachment> atts = attachments.findByMessageIdIn(messageIds);
        for (Attachment a : atts) {
            attByMessage.computeIfAbsent(a.getMessageId(), k -> new ArrayList<>())
                .add(new AttachmentDto(a.getId(), a.getOriginalName(), a.getMimeType(),
                    a.getSizeBytes(), a.isImage(), a.getComment()));
        }

        // 4. build DTOs
        List<MessageDto> out = new ArrayList<>(list.size());
        for (Message m : list) {
            String authorName = username(userMap, m.getAuthorId());
            MessagePreviewDto preview = null;
            if (m.getReplyToId() != null) {
                Message r = replyMap.get(m.getReplyToId());
                if (r != null) {
                    preview = new MessagePreviewDto(r.getId(), r.getAuthorId(),
                        username(userMap, r.getAuthorId()),
                        r.isDeleted() ? null : r.getText(),
                        r.isDeleted());
                }
            }
            out.add(new MessageDto(
                m.getId(), m.getChatId(), m.getAuthorId(), authorName,
                m.isDeleted() ? null : m.getText(),
                m.getReplyToId(), preview,
                m.getCreatedAt(), m.getEditedAt(), m.getDeletedAt(),
                attByMessage.getOrDefault(m.getId(), List.of())));
        }
        return out;
    }

    public MessageDto toDto(Message m) {
        return toDtos(List.of(m)).get(0);
    }

    private static String username(Map<Long, User> map, Long id) {
        if (id == null) return null;
        User u = map.get(id);
        return u == null ? "(deleted)" : u.getUsername();
    }
}
