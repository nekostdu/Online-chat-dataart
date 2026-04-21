-- Schema for online chat. Single-migration bootstrap; later changes go to V2+.

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    username        VARCHAR(64)  NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_users_email_active    ON users (lower(email))    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_active ON users (lower(username)) WHERE deleted_at IS NULL;

CREATE TABLE sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    user_agent      VARCHAR(512),
    ip              VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ
);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);

CREATE TABLE friendships (
    requester_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          VARCHAR(16) NOT NULL CHECK (status IN ('pending','accepted')),
    message         VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at    TIMESTAMPTZ,
    PRIMARY KEY (requester_id, addressee_id),
    CHECK (requester_id <> addressee_id)
);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

CREATE TABLE user_blocks (
    blocker_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE chats (
    id              BIGSERIAL PRIMARY KEY,
    type            VARCHAR(8)  NOT NULL CHECK (type IN ('room','dm')),
    name            VARCHAR(100),
    description     VARCHAR(500),
    visibility      VARCHAR(16) CHECK (visibility IN ('public','private')),
    owner_id        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
-- Unique room names (case-insensitive) among live rooms.
CREATE UNIQUE INDEX idx_chats_room_name_unique
    ON chats (lower(name))
    WHERE type = 'room' AND deleted_at IS NULL;

CREATE TABLE chat_members (
    chat_id     BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(16) NOT NULL CHECK (role IN ('owner','admin','member')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
);
CREATE INDEX idx_chat_members_user ON chat_members(user_id);

CREATE TABLE chat_bans (
    chat_id     BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banned_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    banned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE chat_invitations (
    id              BIGSERIAL PRIMARY KEY,
    chat_id         BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    invited_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at     TIMESTAMPTZ,
    declined_at     TIMESTAMPTZ,
    UNIQUE (chat_id, invited_user_id)
);
CREATE INDEX idx_invitations_user ON chat_invitations(invited_user_id);

CREATE TABLE messages (
    id              BIGSERIAL PRIMARY KEY,
    chat_id         BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    author_id       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    text            TEXT,
    reply_to_id     BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at       TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC, id DESC);
CREATE INDEX idx_messages_reply        ON messages(reply_to_id);

CREATE TABLE attachments (
    id              BIGSERIAL PRIMARY KEY,
    message_id      BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(1024) NOT NULL,
    mime_type       VARCHAR(128),
    size_bytes      BIGINT NOT NULL,
    is_image        BOOLEAN NOT NULL DEFAULT false,
    comment         VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_message ON attachments(message_id);

CREATE TABLE read_receipts (
    chat_id              BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
);
