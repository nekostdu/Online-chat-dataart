package com.dataart.chat.friend;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserBlockRepository extends JpaRepository<UserBlock, UserBlock.PK> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM UserBlock b WHERE " +
           "(b.blockerId = :a AND b.blockedId = :b) OR " +
           "(b.blockerId = :b AND b.blockedId = :a)")
    boolean existsBetween(@Param("a") Long a, @Param("b") Long b);

    List<UserBlock> findByBlockerId(Long blockerId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserBlock b WHERE b.blockerId = :blockerId AND b.blockedId = :blockedId")
    int delete(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);
}
