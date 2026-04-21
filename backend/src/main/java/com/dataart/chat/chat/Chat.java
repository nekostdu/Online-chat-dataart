package com.dataart.chat.chat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "chats")
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** "room" or "dm" */
    @Column(nullable = false, length = 8)
    private String type;

    @Column(length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    /** "public" or "private"; null for dm */
    @Column(length = 16)
    private String visibility;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getVisibility() { return visibility; }
    public Long getOwnerId() { return ownerId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDeletedAt() { return deletedAt; }

    public void setType(String type) { this.type = type; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public boolean isRoom()   { return "room".equals(type); }
    public boolean isDm()     { return "dm".equals(type); }
    public boolean isPublic() { return "public".equals(visibility); }
    public boolean isActive() { return deletedAt == null; }
}
