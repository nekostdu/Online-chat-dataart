package com.dataart.chat.chat;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.MessageBroadcaster;
import com.dataart.chat.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Private-room invitation flow: send, accept, decline. Req 2.4.9. */
@Service
public class RoomInvitationService {

    private final ChatService chatService;
    private final ChatMemberRepository members;
    private final ChatBanRepository bans;
    private final ChatInvitationRepository invitations;
    private final UserRepository users;
    private final MessageBroadcaster broadcaster;

    public RoomInvitationService(ChatService chatService,
                                 ChatMemberRepository members,
                                 ChatBanRepository bans,
                                 ChatInvitationRepository invitations,
                                 UserRepository users,
                                 MessageBroadcaster broadcaster) {
        this.chatService = chatService;
        this.members = members;
        this.bans = bans;
        this.invitations = invitations;
        this.users = users;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public ChatInvitation invite(Long roomId, Long actorId, Long targetId) {
        Chat c = chatService.requireActiveRoom(roomId);
        chatService.requireMember(c, actorId);
        if (targetId.equals(actorId)) throw ApiException.badRequest("cannot invite yourself");
        users.findActiveById(targetId).orElseThrow(() -> ApiException.notFound("user"));
        if (members.findByChatIdAndUserId(roomId, targetId).isPresent()) {
            throw ApiException.conflict("user is already a member");
        }
        if (bans.existsByChatIdAndUserId(roomId, targetId)) {
            throw ApiException.forbidden("user is banned from this room");
        }
        Optional<ChatInvitation> existing = invitations.findPending(roomId, targetId);
        if (existing.isPresent()) return existing.get();
        ChatInvitation inv = new ChatInvitation();
        inv.setChatId(roomId);
        inv.setInvitedUserId(targetId);
        inv.setInvitedBy(actorId);
        ChatInvitation saved = invitations.save(inv);
        broadcaster.invitationSent(targetId);
        return saved;
    }

    @Transactional
    public Chat acceptInvitation(Long invitationId, Long userId) {
        ChatInvitation inv = invitations.findById(invitationId)
            .orElseThrow(() -> ApiException.notFound("invitation"));
        if (!inv.getInvitedUserId().equals(userId)) throw ApiException.forbidden("not your invitation");
        if (!inv.isPending()) throw ApiException.badRequest("invitation already handled");
        Chat c = chatService.requireActiveRoom(inv.getChatId());
        if (bans.existsByChatIdAndUserId(c.getId(), userId)) throw ApiException.forbidden("banned");
        if (members.findByChatIdAndUserId(c.getId(), userId).isEmpty()) {
            chatService.addMember(c.getId(), userId, "member");
        }
        inv.setAcceptedAt(Instant.now());
        broadcaster.chatCreated(List.of(userId));
        return c;
    }

    @Transactional
    public void declineInvitation(Long invitationId, Long userId) {
        ChatInvitation inv = invitations.findById(invitationId)
            .orElseThrow(() -> ApiException.notFound("invitation"));
        if (!inv.getInvitedUserId().equals(userId)) throw ApiException.forbidden("not your invitation");
        if (!inv.isPending()) return;
        inv.setDeclinedAt(Instant.now());
    }
}
