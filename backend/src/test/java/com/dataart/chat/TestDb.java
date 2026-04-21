package com.dataart.chat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Wipes all data between tests without dropping the schema. */
@Component
public class TestDb {

    private final JdbcTemplate jdbc;

    @Autowired
    public TestDb(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** TRUNCATE all domain tables (keeps Flyway schema history). */
    public void wipe() {
        jdbc.execute("""
            TRUNCATE TABLE
              read_receipts,
              attachments,
              messages,
              chat_invitations,
              chat_bans,
              chat_members,
              chats,
              user_blocks,
              friendships,
              password_reset_tokens,
              sessions,
              users
            RESTART IDENTITY CASCADE
            """);
    }
}
