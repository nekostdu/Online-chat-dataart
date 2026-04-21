package com.dataart.chat.friend;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface FriendshipRepository extends JpaRepository<Friendship, Friendship.PK> {

    /** Friendship record regardless of direction. */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requesterId = :a AND f.addresseeId = :b) OR " +
           "(f.requesterId = :b AND f.addresseeId = :a)")
    Optional<Friendship> findBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("SELECT f FROM Friendship f WHERE f.status = 'accepted' AND " +
           "(f.requesterId = :userId OR f.addresseeId = :userId)")
    List<Friendship> findAcceptedFor(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.status = 'pending' AND f.addresseeId = :userId " +
           "ORDER BY f.createdAt DESC")
    List<Friendship> findIncomingPending(@Param("userId") Long userId);

    @Query("SELECT f FROM Friendship f WHERE f.status = 'pending' AND f.requesterId = :userId " +
           "ORDER BY f.createdAt DESC")
    List<Friendship> findOutgoingPending(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Friendship f WHERE " +
           "(f.requesterId = :a AND f.addresseeId = :b) OR " +
           "(f.requesterId = :b AND f.addresseeId = :a)")
    int deleteBetween(@Param("a") Long a, @Param("b") Long b);
}
