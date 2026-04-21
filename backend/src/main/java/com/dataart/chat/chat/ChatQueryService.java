package com.dataart.chat.chat;

import com.dataart.chat.chat.ChatDtos.BanDto;
import com.dataart.chat.chat.ChatDtos.ChatSummary;
import com.dataart.chat.chat.ChatDtos.InvitationDto;
import com.dataart.chat.chat.ChatDtos.MemberDto;
import com.dataart.chat.chat.ChatDtos.RoomSummary;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.ChatMetricsRepository;
import com.dataart.chat.message.ChatMetricsRepository.ChatMetric;
import com.dataart.chat.message.ChatMetricsRepository.UnreadMetric;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserDto;
import com.dataart.chat.user.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read models for chats — assembles DTOs from multiple tables. */
@Service
public class ChatQueryService {

    private final ChatRepository chats;
    private final ChatMemberRepository members;
    private final ChatBanRepository bans;
    private final ChatInvitationRepository invitations;
    private final UserRepository users;
    private final ChatMetricsRepository metrics;

    public ChatQueryService(ChatRepository chats,
                            ChatMemberRepository members,
                            ChatBanRepository bans,
                            ChatInvitationRepository invitations,
                            UserRepository users,
                            ChatMetricsRepository metrics) {
        this.chats = chats;
        this.members = members;
        this.bans = bans;
        this.invitations = invitations;
        this.users = users;
        this.metrics = metrics;
    }

    @Transactional(readOnly = true)
    public List<RoomSummary> publicCatalog(String query, int limit) {
        return chats.searchPublic(query == null ? "" : query.trim(),
                org.springframework.data.domain.PageRequest.of(0, Math.min(Math.max(limit, 1), 100))).stream()
            .map(c -> new RoomSummary(
                c.getId(), c.getName(), c.getDescription(), c.getVisibility(), c.getOwnerId(),
                members.countByChatId(c.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatSummary> myChats(Long userId) {
        List<ChatMember> memberships = members.findByUserId(userId);
        List<Long> chatIds = memberships.stream().map(ChatMember::getChatId).toList();
        if (chatIds.isEmpty()) return List.of();

        Map<Long, Chat> chatMap = new HashMap<>();
        for (Chat c : chats.findAllById(chatIds)) {
            if (c.getDeletedAt() == null) chatMap.put(c.getId(), c);
        }

        Map<Long, Long> unreadByChat = new HashMap<>();
        for (UnreadMetric u : metrics.unread(userId, chatIds)) {
            unreadByChat.put(u.getChatId(), u.getUnread());
        }
        Map<Long, Instant> lastAtByChat = new HashMap<>();
        for (ChatMetric m : metrics.metrics(chatIds)) {
            lastAtByChat.put(m.getChatId(), m.getLastMessageAt());
        }

        List<ChatSummary> out = new ArrayList<>();
        for (Chat c : chatMap.values()) {
            UserDto peer = null;
            if (c.isDm()) {
                for (Long other : members.findUserIdsByChatId(c.getId())) {
                    if (!other.equals(userId)) {
                        peer = users.findActiveById(other).map(UserDto::publicOf).orElse(null);
                        break;
                    }
                }
            }
            out.add(new ChatSummary(
                c.getId(), c.getType(), c.getName(), c.getDescription(), c.getVisibility(),
                c.getOwnerId(),
                members.countByChatId(c.getId()),
                unreadByChat.getOrDefault(c.getId(), 0L),
                lastAtByChat.get(c.getId()),
                peer));
        }
        out.sort(Comparator.comparing(ChatSummary::name, Comparator.nullsLast(String::compareToIgnoreCase)));
        return out;
    }

    @Transactional(readOnly = true)
    public List<MemberDto> members(Long chatId, Long viewerId, int page, int size) {
        Chat c = chats.findActive(chatId).orElseThrow(() -> ApiException.notFound("chat"));
        members.findByChatIdAndUserId(chatId, viewerId)
            .orElseThrow(() -> ApiException.forbidden("not a member"));
        int safeSize = Math.min(Math.max(size, 1), 200);
        int safePage = Math.max(page, 0);
        List<ChatMember> list = members.findByChatIdPaged(chatId,
            org.springframework.data.domain.PageRequest.of(safePage, safeSize));
        List<Long> userIds = list.stream().map(ChatMember::getUserId).toList();
        Map<Long, User> byId = new HashMap<>();
        for (User u : users.findActiveByIds(userIds)) byId.put(u.getId(), u);
        return list.stream()
            .map(m -> {
                User u = byId.get(m.getUserId());
                return new MemberDto(
                    m.getUserId(),
                    u == null ? "(deleted)" : u.getUsername(),
                    m.getRole(),
                    m.getJoinedAt());
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BanDto> bans(Long chatId, Long viewerId) {
        Chat c = chats.findActive(chatId).orElseThrow(() -> ApiException.notFound("chat"));
        ChatMember viewer = members.findByChatIdAndUserId(chatId, viewerId)
            .orElseThrow(() -> ApiException.forbidden("not a member"));
        if (!viewer.isAdmin()) throw ApiException.forbidden("admin only");

        List<ChatBan> list = bans.findByChatId(chatId);
        List<Long> ids = new ArrayList<>();
        for (ChatBan b : list) {
            ids.add(b.getUserId());
            if (b.getBannedBy() != null) ids.add(b.getBannedBy());
        }
        Map<Long, User> byId = new HashMap<>();
        for (User u : users.findActiveByIds(ids)) byId.put(u.getId(), u);
        return list.stream()
            .sorted(Comparator.comparing(ChatBan::getBannedAt).reversed())
            .map(b -> new BanDto(
                b.getUserId(),
                byId.getOrDefault(b.getUserId(), fallback(b.getUserId())).getUsername(),
                b.getBannedBy(),
                b.getBannedBy() == null ? null : byId.getOrDefault(b.getBannedBy(), fallback(b.getBannedBy())).getUsername(),
                b.getBannedAt()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationDto> myInvitations(Long userId) {
        List<ChatInvitation> list = invitations.findPendingForUser(userId);
        if (list.isEmpty()) return List.of();

        List<Long> chatIds = list.stream().map(ChatInvitation::getChatId).toList();
        Map<Long, Chat> chatMap = new HashMap<>();
        for (Chat c : chats.findAllById(chatIds)) {
            if (c.getDeletedAt() == null) chatMap.put(c.getId(), c);
        }
        List<Long> inviterIds = list.stream().map(ChatInvitation::getInvitedBy).toList();
        Map<Long, User> userMap = new HashMap<>();
        for (User u : users.findActiveByIds(inviterIds)) userMap.put(u.getId(), u);

        List<InvitationDto> out = new ArrayList<>();
        for (ChatInvitation inv : list) {
            Chat c = chatMap.get(inv.getChatId());
            if (c == null) continue;
            User inviter = userMap.get(inv.getInvitedBy());
            out.add(new InvitationDto(
                inv.getId(), c.getId(), c.getName(), c.getDescription(),
                inviter == null ? null : UserDto.publicOf(inviter),
                inv.getCreatedAt()));
        }
        return out;
    }

    private static User fallback(Long userId) {
        User u = new User();
        u.setId(userId);
        u.setUsername("(deleted)");
        return u;
    }
}
