package com.dataart.chat.user;

import java.time.Instant;

public record UserDto(Long id, String username, String email, Instant lastLoginAt) {

    public static UserDto of(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getEmail(), u.getLastLoginAt());
    }

    /** Public version without email and without last-login (private data). */
    public static UserDto publicOf(User u) {
        return new UserDto(u.getId(), u.getUsername(), null, null);
    }
}
