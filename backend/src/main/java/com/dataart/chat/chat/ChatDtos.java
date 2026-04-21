package com.dataart.chat.chat;

import com.dataart.chat.user.UserDto;
import java.time.Instant;

public final class ChatDtos {
    private ChatDtos() {}

    public record RoomSummary(
        Long id,
        String name,
        String description,
        String visibility,
        Long ownerId,
        long memberCount) {}

    public record ChatSummary(
        Long id,
        String type,
        String name,
        String description,
        String visibility,
        Long ownerId,
        long memberCount,
        long unreadCount,
        Instant lastMessageAt,
        UserDto peer) {}

    public record MemberDto(
        Long userId,
        String username,
        String role,
        Instant joinedAt) {}

    public record BanDto(
        Long userId,
        String username,
        Long bannedBy,
        String bannedByUsername,
        Instant bannedAt) {}

    public record InvitationDto(
        Long id,
        Long chatId,
        String chatName,
        String chatDescription,
        UserDto invitedBy,
        Instant createdAt) {}
}
