package com.dataart.chat.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "user_blocks")
@IdClass(UserBlock.PK.class)
public class UserBlock {

    @Id
    @Column(name = "blocker_id")
    private Long blockerId;

    @Id
    @Column(name = "blocked_id")
    private Long blockedId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getBlockerId() { return blockerId; }
    public Long getBlockedId() { return blockedId; }
    public Instant getCreatedAt() { return createdAt; }

    public void setBlockerId(Long blockerId) { this.blockerId = blockerId; }
    public void setBlockedId(Long blockedId) { this.blockedId = blockedId; }

    public static class PK implements Serializable {
        private Long blockerId;
        private Long blockedId;

        public PK() {}
        public PK(Long blockerId, Long blockedId) {
            this.blockerId = blockerId;
            this.blockedId = blockedId;
        }

        public Long getBlockerId() { return blockerId; }
        public Long getBlockedId() { return blockedId; }
        public void setBlockerId(Long blockerId) { this.blockerId = blockerId; }
        public void setBlockedId(Long blockedId) { this.blockedId = blockedId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(blockerId, pk.blockerId) && Objects.equals(blockedId, pk.blockedId);
        }

        @Override
        public int hashCode() { return Objects.hash(blockerId, blockedId); }
    }
}
