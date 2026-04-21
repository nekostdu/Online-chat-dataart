package com.dataart.chat.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "chat_bans")
@IdClass(ChatBan.PK.class)
public class ChatBan {

    @Id
    @Column(name = "chat_id")
    private Long chatId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "banned_by")
    private Long bannedBy;

    @Column(name = "banned_at", nullable = false)
    private Instant bannedAt = Instant.now();

    public Long getChatId()   { return chatId; }
    public Long getUserId()   { return userId; }
    public Long getBannedBy() { return bannedBy; }
    public Instant getBannedAt() { return bannedAt; }

    public void setChatId(Long chatId)   { this.chatId = chatId; }
    public void setUserId(Long userId)   { this.userId = userId; }
    public void setBannedBy(Long bannedBy) { this.bannedBy = bannedBy; }

    public static class PK implements Serializable {
        private Long chatId;
        private Long userId;

        public PK() {}
        public PK(Long chatId, Long userId) {
            this.chatId = chatId;
            this.userId = userId;
        }

        public Long getChatId() { return chatId; }
        public Long getUserId() { return userId; }
        public void setChatId(Long chatId) { this.chatId = chatId; }
        public void setUserId(Long userId) { this.userId = userId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(chatId, pk.chatId) && Objects.equals(userId, pk.userId);
        }

        @Override
        public int hashCode() { return Objects.hash(chatId, userId); }
    }
}
