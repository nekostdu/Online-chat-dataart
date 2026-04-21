package com.dataart.chat.chat;

import com.dataart.chat.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Membership mutations for rooms: join, leave, kick/ban, admin promotion. */
@Service
public class RoomMembershipService {

    private final ChatService chatService;
    private final ChatMemberRepository members;
    private final ChatBanRepository bans;

    public RoomMembershipService(ChatService chatService,
                                 ChatMemberRepository members,
                                 ChatBanRepository bans) {
        this.chatService = chatService;
        this.members = members;
        this.bans = bans;
    }

    @Transactional
    public void joinPublicRoom(Long roomId, Long userId) {
        Chat c = chatService.requireActiveRoom(roomId);
        if (!c.isPublic()) throw ApiException.forbidden("room is private");
        if (bans.existsByChatIdAndUserId(roomId, userId)) throw ApiException.forbidden("banned from this room");
        if (members.findByChatIdAndUserId(roomId, userId).isPresent()) return;
        chatService.addMember(roomId, userId, "member");
    }

    @Transactional
    public void leaveRoom(Long roomId, Long userId) {
        chatService.requireActiveRoom(roomId);
        ChatMember m = members.findByChatIdAndUserId(roomId, userId)
            .orElseThrow(() -> ApiException.notFound("not a member"));
        if (m.isOwner()) throw ApiException.badRequest("owner cannot leave; delete the room instead");
        members.deleteByChatIdAndUserId(roomId, userId);
    }

    /** Kick = ban: removes the user and adds a row in chat_bans (req 2.4.8). */
    @Transactional
    public void kickMember(Long roomId, Long actorId, Long targetId) {
        Chat c = chatService.requireActiveRoom(roomId);
        chatService.requireAdmin(c, actorId);
        if (targetId.equals(c.getOwnerId())) throw ApiException.forbidden("cannot remove owner");
        ChatMember target = members.findByChatIdAndUserId(roomId, targetId)
            .orElseThrow(() -> ApiException.notFound("not a member"));
        if (target.isAdmin() && !actorId.equals(c.getOwnerId())) {
            throw ApiException.forbidden("only owner can remove admins");
        }
        members.deleteByChatIdAndUserId(roomId, targetId);
        ChatBan ban = new ChatBan();
        ban.setChatId(roomId);
        ban.setUserId(targetId);
        ban.setBannedBy(actorId);
        bans.save(ban);
    }

    @Transactional
    public void unban(Long roomId, Long actorId, Long targetId) {
        Chat c = chatService.requireActiveRoom(roomId);
        chatService.requireAdmin(c, actorId);
        bans.deleteByChatIdAndUserId(roomId, targetId);
    }

    @Transactional
    public void makeAdmin(Long roomId, Long actorId, Long targetId) {
        Chat c = chatService.requireActiveRoom(roomId);
        chatService.requireAdmin(c, actorId);
        ChatMember m = members.findByChatIdAndUserId(roomId, targetId)
            .orElseThrow(() -> ApiException.notFound("not a member"));
        if (!m.isAdmin()) m.setRole("admin");
    }

    @Transactional
    public void removeAdmin(Long roomId, Long actorId, Long targetId) {
        Chat c = chatService.requireActiveRoom(roomId);
        chatService.requireAdmin(c, actorId);
        if (targetId.equals(c.getOwnerId())) throw ApiException.forbidden("cannot demote owner");
        ChatMember target = members.findByChatIdAndUserId(roomId, targetId)
            .orElseThrow(() -> ApiException.notFound("not a member"));
        if ("admin".equals(target.getRole())) target.setRole("member");
    }
}
