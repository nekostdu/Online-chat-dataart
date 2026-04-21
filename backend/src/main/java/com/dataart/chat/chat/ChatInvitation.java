package com.dataart.chat.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(name = "chat_invitations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"chat_id", "invited_user_id"}))
public class ChatInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Column(name = "invited_user_id", nullable = false)
    private Long invitedUserId;

    @Column(name = "invited_by", nullable = false)
    private Long invitedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "declined_at")
    private Instant declinedAt;

    public Long getId() { return id; }
    public Long getChatId() { return chatId; }
    public Long getInvitedUserId() { return invitedUserId; }
    public Long getInvitedBy() { return invitedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public Instant getDeclinedAt() { return declinedAt; }

    public void setChatId(Long chatId) { this.chatId = chatId; }
    public void setInvitedUserId(Long invitedUserId) { this.invitedUserId = invitedUserId; }
    public void setInvitedBy(Long invitedBy) { this.invitedBy = invitedBy; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
    public void setDeclinedAt(Instant declinedAt) { this.declinedAt = declinedAt; }

    public boolean isPending() { return acceptedAt == null && declinedAt == null; }
}
