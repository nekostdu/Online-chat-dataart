package com.dataart.chat.chat;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.AttachmentRepository;
import com.dataart.chat.message.MessageBroadcaster;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserDeletedEvent;
import com.dataart.chat.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Room CRUD + DM opening + membership/admin guards shared by other services.
 * Membership mutations live in {@link RoomMembershipService},
 * invitations in {@link RoomInvitationService}.
 */
@Service
public class ChatService {

    private static final Pattern ROOM_NAME = Pattern.compile("^[a-zA-Z0-9 _.\\-]{3,64}$");

    private final ChatRepository chats;
    private final ChatMemberRepository members;
    private final UserRepository users;
    private final AttachmentRepository attachments;
    private final MessageBroadcaster broadcaster;
    private final ApplicationEventPublisher events;

    public ChatService(ChatRepository chats,
                       ChatMemberRepository members,
                       UserRepository users,
                       AttachmentRepository attachments,
                       MessageBroadcaster broadcaster,
                       ApplicationEventPublisher events) {
        this.chats = chats;
        this.members = members;
        this.users = users;
        this.attachments = attachments;
        this.broadcaster = broadcaster;
        this.events = events;
    }

    /** Published after a room is hard-deleted so file cleanup + broadcast run after the commit. */
    public record RoomDeletedEvent(Long chatId, List<Long> formerMemberIds, List<String> filePaths) {}

    // --- rooms ---

    @Transactional
    public Chat createRoom(Long ownerId, String name, String description, String visibility) {
        validateRoomName(name);
        if (!"public".equals(visibility) && !"private".equals(visibility)) {
            throw ApiException.badRequest("visibility must be 'public' or 'private'");
        }
        if (chats.findByRoomName(name.trim()).isPresent()) {
            throw ApiException.conflict("room name already taken");
        }
        Chat c = new Chat();
        c.setType("room");
        c.setName(name.trim());
        c.setDescription(description);
        c.setVisibility(visibility);
        c.setOwnerId(ownerId);
        c = chats.save(c);

        ChatMember owner = new ChatMember();
        owner.setChatId(c.getId());
        owner.setUserId(ownerId);
        owner.setRole("owner");
        members.save(owner);
        return c;
    }

    @Transactional(readOnly = true)
    public List<Chat> searchPublicRooms(String query, int limit) {
        String q = query == null ? "" : query.trim();
        return chats.searchPublic(q, PageRequest.of(0, Math.min(Math.max(limit, 1), 100)));
    }

    @Transactional
    public void deleteRoom(Long roomId, Long actorId) {
        Chat c = requireActiveRoom(roomId);
        requireOwner(c, actorId);
        hardDeleteChat(c);
    }

    @Transactional
    public void updateRoom(Long roomId, Long actorId, String name, String description, String visibility) {
        Chat c = requireActiveRoom(roomId);
        requireOwner(c, actorId);
        if (name != null && !name.equals(c.getName())) {
            validateRoomName(name);
            chats.findByRoomName(name.trim()).ifPresent(other -> {
                if (!other.getId().equals(roomId)) throw ApiException.conflict("room name already taken");
            });
            c.setName(name.trim());
        }
        if (description != null) c.setDescription(description);
        if (visibility != null) {
            if (!"public".equals(visibility) && !"private".equals(visibility)) {
                throw ApiException.badRequest("visibility must be 'public' or 'private'");
            }
            c.setVisibility(visibility);
        }
    }

    /** Create or get the DM chat between (currentUser, otherUser). */
    @Transactional
    public Chat openDm(Long a, Long b) {
        if (a.equals(b)) throw ApiException.badRequest("cannot DM yourself");
        users.findActiveById(b).orElseThrow(() -> ApiException.notFound("user"));
        Optional<Chat> existing = chats.findDmBetween(a, b);
        if (existing.isPresent()) return existing.get();
        Chat c = new Chat();
        c.setType("dm");
        c = chats.save(c);
        addMember(c.getId(), a, "member");
        addMember(c.getId(), b, "member");
        broadcaster.chatCreated(List.of(a, b));
        return c;
    }

    // --- guards (shared by other services) ---

    public Chat requireActiveRoom(Long id) {
        Chat c = chats.findActive(id).orElseThrow(() -> ApiException.notFound("room"));
        if (!c.isRoom()) throw ApiException.badRequest("not a room");
        return c;
    }

    public Chat requireActive(Long id) {
        return chats.findActive(id).orElseThrow(() -> ApiException.notFound("chat"));
    }

    public ChatMember requireMember(Chat c, Long userId) {
        return members.findByChatIdAndUserId(c.getId(), userId)
            .orElseThrow(() -> ApiException.forbidden("not a member of this chat"));
    }

    public void requireAdmin(Chat c, Long userId) {
        if (!c.isRoom()) throw ApiException.badRequest("not a room");
        if (!requireMember(c, userId).isAdmin()) throw ApiException.forbidden("admin rights required");
    }

    public void requireOwner(Chat c, Long userId) {
        if (!userId.equals(c.getOwnerId())) throw ApiException.forbidden("owner only");
    }

    public User lookupUserByUsername(String username) {
        return users.findActiveByUsername(username).orElseThrow(() -> ApiException.notFound("user"));
    }

    /** Package-private helper used by membership/invitation services. */
    void addMember(Long chatId, Long userId, String role) {
        ChatMember m = new ChatMember();
        m.setChatId(chatId);
        m.setUserId(userId);
        m.setRole(role);
        members.save(m);
    }

    // --- cascade on user deletion (req 2.1.5) ---

    @EventListener
    @Transactional
    public void onUserDeleted(UserDeletedEvent e) {
        for (Chat owned : chats.findActiveOwnedBy(e.userId())) hardDeleteChat(owned);
        members.deleteByUserId(e.userId());
    }

    /** DB cascades wipe members/bans/invitations/messages/attachments/receipts.
     *  File cleanup + broadcast happen after commit via {@link RoomCleanupListener}. */
    private void hardDeleteChat(Chat c) {
        List<Long> memberIds = new ArrayList<>(members.findUserIdsByChatId(c.getId()));
        List<String> paths = attachments.findStoredPathsByChatId(c.getId());
        chats.delete(c);
        events.publishEvent(new RoomDeletedEvent(c.getId(), memberIds, paths));
    }

    private static void validateRoomName(String name) {
        if (name == null || !ROOM_NAME.matcher(name.trim()).matches()) {
            throw ApiException.badRequest("room name must be 3–64 chars: letters/digits/space/._-");
        }
    }
}
