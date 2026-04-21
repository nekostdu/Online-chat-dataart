package com.dataart.chat.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Column(name = "author_id")
    private Long authorId;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Column(name = "reply_to_id")
    private Long replyToId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Long getId()        { return id; }
    public Long getChatId()    { return chatId; }
    public Long getAuthorId()  { return authorId; }
    public String getText()    { return text; }
    public Long getReplyToId() { return replyToId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getEditedAt()  { return editedAt; }
    public Instant getDeletedAt() { return deletedAt; }

    public void setChatId(Long chatId)     { this.chatId = chatId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public void setText(String text)       { this.text = text; }
    public void setReplyToId(Long replyToId) { this.replyToId = replyToId; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public boolean isDeleted() { return deletedAt != null; }
    public boolean isEdited()  { return editedAt  != null; }
}
