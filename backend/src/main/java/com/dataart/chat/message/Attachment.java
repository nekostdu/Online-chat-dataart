package com.dataart.chat.message;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nullable until the message is created; we upload first, then attach. */
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_path", nullable = false, length = 1024)
    private String storedPath;

    @Column(name = "mime_type", length = 128)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "is_image", nullable = false)
    private boolean image;

    @Column(length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId()              { return id; }
    public Long getMessageId()       { return messageId; }
    public Long getUploadedBy()      { return uploadedBy; }
    public String getOriginalName()  { return originalName; }
    public String getStoredPath()    { return storedPath; }
    public String getMimeType()      { return mimeType; }
    public long getSizeBytes()       { return sizeBytes; }
    public boolean isImage()         { return image; }
    public String getComment()       { return comment; }
    public Instant getCreatedAt()    { return createdAt; }

    public void setMessageId(Long messageId)     { this.messageId = messageId; }
    public void setUploadedBy(Long uploadedBy)   { this.uploadedBy = uploadedBy; }
    public void setOriginalName(String name)     { this.originalName = name; }
    public void setStoredPath(String path)       { this.storedPath = path; }
    public void setMimeType(String mimeType)     { this.mimeType = mimeType; }
    public void setSizeBytes(long sizeBytes)     { this.sizeBytes = sizeBytes; }
    public void setImage(boolean image)          { this.image = image; }
    public void setComment(String comment)       { this.comment = comment; }
}
