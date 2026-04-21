package com.dataart.chat.message;

import java.time.Instant;
import java.util.List;

public final class MessageDtos {
    private MessageDtos() {}

    public record AttachmentDto(
        Long id,
        String originalName,
        String mimeType,
        long sizeBytes,
        boolean isImage,
        String comment) {}

    public record MessagePreviewDto(
        Long id,
        Long authorId,
        String authorUsername,
        String text,
        boolean deleted) {}

    public record MessageDto(
        Long id,
        Long chatId,
        Long authorId,
        String authorUsername,
        String text,
        Long replyToId,
        MessagePreviewDto replyTo,
        Instant createdAt,
        Instant editedAt,
        Instant deletedAt,
        List<AttachmentDto> attachments) {}
}
