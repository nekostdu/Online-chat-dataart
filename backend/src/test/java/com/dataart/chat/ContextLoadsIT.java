package com.dataart.chat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

class ContextLoadsIT extends AbstractIT {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void springContextStartsAndSchemaIsApplied() {
        // Flyway should have created all domain tables.
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = 'public'
               AND table_name IN ('users','sessions','chats','chat_members','messages','attachments')
            """, Long.class);
        assertThat(count).isEqualTo(6L);
    }
}
