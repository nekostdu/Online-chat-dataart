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
@Table(name = "chat_members")
@IdClass(ChatMember.PK.class)
public class ChatMember {

    @Id
    @Column(name = "chat_id")
    private Long chatId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 16)
    private String role;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt = Instant.now();

    public Long getChatId()   { return chatId; }
    public Long getUserId()   { return userId; }
    public String getRole()   { return role; }
    public Instant getJoinedAt() { return joinedAt; }

    public void setChatId(Long chatId) { this.chatId = chatId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setRole(String role)   { this.role = role; }

    public boolean isOwner() { return "owner".equals(role); }
    public boolean isAdmin() { return "admin".equals(role) || isOwner(); }

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
