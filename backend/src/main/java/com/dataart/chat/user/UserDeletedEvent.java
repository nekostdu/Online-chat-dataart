package com.dataart.chat.user;

/** Broadcast after a user is soft-deleted. Chat module reacts to cascade room deletion. */
public record UserDeletedEvent(Long userId) {}
