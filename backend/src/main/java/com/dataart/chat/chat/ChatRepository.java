package com.dataart.chat.chat;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Query("SELECT c FROM Chat c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Chat> findActive(@Param("id") Long id);

    @Query("""
        SELECT c FROM Chat c
        WHERE c.type = 'room' AND c.deletedAt IS NULL
          AND c.visibility = 'public'
          AND (:q = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
                       OR LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY c.name ASC
        """)
    List<Chat> searchPublic(@Param("q") String q, Pageable pageable);

    @Query("SELECT c FROM Chat c WHERE c.type = 'room' AND c.deletedAt IS NULL AND LOWER(c.name) = LOWER(:name)")
    Optional<Chat> findByRoomName(@Param("name") String name);

    @Query("SELECT c FROM Chat c WHERE c.type = 'room' AND c.ownerId = :userId AND c.deletedAt IS NULL")
    List<Chat> findActiveOwnedBy(@Param("userId") Long userId);

    /** Find DM between two users (if exists); type='dm' rooms have no name and exactly two members. */
    @Query("""
        SELECT c FROM Chat c
        WHERE c.type = 'dm' AND c.deletedAt IS NULL
          AND c.id IN (SELECT m.chatId FROM ChatMember m WHERE m.userId = :a)
          AND c.id IN (SELECT m.chatId FROM ChatMember m WHERE m.userId = :b)
        """)
    Optional<Chat> findDmBetween(@Param("a") Long a, @Param("b") Long b);
}
