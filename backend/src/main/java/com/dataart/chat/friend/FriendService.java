package com.dataart.chat.friend;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.MessageBroadcaster;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendService {

    private final FriendshipRepository friendships;
    private final UserBlockRepository blocks;
    private final UserRepository users;
    private final MessageBroadcaster broadcaster;

    public FriendService(FriendshipRepository friendships,
                         UserBlockRepository blocks,
                         UserRepository users,
                         MessageBroadcaster broadcaster) {
        this.friendships = friendships;
        this.blocks = blocks;
        this.users = users;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public Friendship sendRequest(Long requesterId, Long addresseeId, String message) {
        if (requesterId.equals(addresseeId)) throw ApiException.badRequest("cannot befriend yourself");
        users.findActiveById(addresseeId).orElseThrow(() -> ApiException.notFound("user"));
        if (blocks.existsBetween(requesterId, addresseeId)) {
            throw ApiException.forbidden("blocked");
        }
        Optional<Friendship> existing = friendships.findBetween(requesterId, addresseeId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.isAccepted()) return f;
            // if the addressee previously sent a request to us, auto-accept
            if (f.isPending() && f.getAddresseeId().equals(requesterId)) {
                f.setStatus("accepted");
                f.setConfirmedAt(Instant.now());
                broadcaster.friendsChanged(List.of(requesterId, addresseeId));
                return f;
            }
            return f;
        }
        Friendship f = new Friendship();
        f.setRequesterId(requesterId);
        f.setAddresseeId(addresseeId);
        f.setStatus("pending");
        f.setMessage(message);
        Friendship saved = friendships.save(f);
        // Let the addressee's sidebar surface the new pending request instantly.
        broadcaster.friendsChanged(List.of(addresseeId));
        return saved;
    }

    @Transactional
    public Friendship sendRequestByUsername(Long requesterId, String username, String message) {
        User target = users.findActiveByUsername(username)
            .orElseThrow(() -> ApiException.notFound("user"));
        return sendRequest(requesterId, target.getId(), message);
    }

    @Transactional
    public Friendship accept(Long requesterId, Long addresseeId, Long actorId) {
        Friendship f = friendships.findById(new Friendship.PK(requesterId, addresseeId))
            .orElseThrow(() -> ApiException.notFound("request"));
        if (!f.getAddresseeId().equals(actorId)) throw ApiException.forbidden("not your request");
        if (!f.isPending()) throw ApiException.badRequest("already handled");
        f.setStatus("accepted");
        f.setConfirmedAt(Instant.now());
        broadcaster.friendsChanged(List.of(requesterId, addresseeId));
        return f;
    }

    @Transactional
    public void decline(Long requesterId, Long addresseeId, Long actorId) {
        Friendship f = friendships.findById(new Friendship.PK(requesterId, addresseeId))
            .orElseThrow(() -> ApiException.notFound("request"));
        if (!f.getAddresseeId().equals(actorId)) throw ApiException.forbidden("not your request");
        friendships.delete(f);
        broadcaster.friendsChanged(List.of(requesterId, addresseeId));
    }

    @Transactional
    public void removeFriend(Long userId, Long otherId) {
        friendships.deleteBetween(userId, otherId);
        broadcaster.friendsChanged(List.of(userId, otherId));
    }

    @Transactional
    public void block(Long actorId, Long targetId) {
        if (actorId.equals(targetId)) throw ApiException.badRequest("cannot block yourself");
        users.findActiveById(targetId).orElseThrow(() -> ApiException.notFound("user"));
        UserBlock b = new UserBlock();
        b.setBlockerId(actorId);
        b.setBlockedId(targetId);
        blocks.save(b);
        // Terminate friendship on block (req 2.3.5: "friend relationship is effectively terminated")
        friendships.deleteBetween(actorId, targetId);
        broadcaster.friendsChanged(List.of(actorId, targetId));
    }

    @Transactional
    public void unblock(Long actorId, Long targetId) {
        blocks.delete(actorId, targetId);
        broadcaster.friendsChanged(List.of(actorId, targetId));
    }

    @Transactional(readOnly = true)
    public boolean areFriends(Long a, Long b) {
        return friendships.findBetween(a, b).map(Friendship::isAccepted).orElse(false);
    }

    @Transactional(readOnly = true)
    public boolean isBlocked(Long a, Long b) {
        return blocks.existsBetween(a, b);
    }

    @Transactional(readOnly = true)
    public List<Friendship> listAccepted(Long userId) {
        return friendships.findAcceptedFor(userId);
    }

    @Transactional(readOnly = true)
    public List<Friendship> listIncomingPending(Long userId) {
        return friendships.findIncomingPending(userId);
    }

    @Transactional(readOnly = true)
    public List<Friendship> listOutgoingPending(Long userId) {
        return friendships.findOutgoingPending(userId);
    }

    @Transactional(readOnly = true)
    public List<UserBlock> listBlocked(Long userId) {
        return blocks.findByBlockerId(userId);
    }
}
