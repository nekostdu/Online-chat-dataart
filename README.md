# Online Chat (DataArt Hackathon)

Classic web chat implementing `Requirements.docx` sections 1–5:
public and private chat rooms, direct messaging, contacts, file attachments,
room moderation, online/AFK/offline presence, infinite-scroll message history
and per-room unread indicators.

## Run it

```bash
docker compose up --build
```

Open <http://localhost:8080>.

| URL                       | What                                    |
|---------------------------|-----------------------------------------|
| <http://localhost:8080>   | Application (React served via nginx)    |
| <http://localhost:8025>   | MailHog web UI — password-reset emails  |

First `docker compose up` builds the backend and frontend images (~3–5 min).

### Data persistence

Postgres data (`pgdata`) and uploaded files (`uploads`) are stored in named Docker volumes
that **survive** `docker compose down`, `docker compose stop`, and `docker compose up --build`.
Users, rooms, messages, and attachments remain intact across any of those.

Only `docker compose down -v` **deletes the volumes** — use it on purpose when you want a
clean slate. If you see your data gone after restarting the stack, check whether you (or a
script) ran `-v`.

### Quick smoke-test

1. Register two users A and B (different browsers / incognito windows).
2. A creates a public room in *Create room* → B opens *Public rooms*, joins it.
3. A and B chat in the room — new messages appear in real time.
   - Try *Reply*, *Edit*, *Delete*; reply shows a quoted block; edited messages show a grey "(edited)".
4. A attaches a file (20 MB max) and an image (3 MB max) via 📎 or paste.
5. A and B become friends via *Contacts → Add → username*, accept on the other side, then *Message* to open a DM.
6. A blocks B from *Contacts → Friends → Block* — new messages are refused, existing history stays visible, read-only.
7. A creates a *Private* room, invites C (third user). C sees the invitation in the sidebar and accepts.
8. From *Manage room*, A promotes another user to admin, bans / unbans a user, edits room settings.
9. Close all of B's tabs → within a couple of seconds A sees B as offline.
   After 60 s of inactivity in an open tab, a user becomes AFK (yellow dot).
10. A opens *Sessions & profile* and revokes remote sessions or changes password;
   in Danger zone can delete the account (their owned rooms get removed).

Password reset:
* From the login screen choose *Forgot password*, enter your email.
* Open MailHog at <http://localhost:8025> to grab the reset link.
* Follow the link to set a new password.

## Architecture

**Backend** — Java 21, Spring Boot 3.3:
- Spring Security with a custom DB-backed session cookie (`CHATSESSION`, HttpOnly, SameSite=Lax).
- Spring Data JPA + PostgreSQL 16, schema managed by Flyway (`backend/src/main/resources/db/migration`).
- Spring WebSocket + STOMP simple in-memory broker; real-time fan-out through
  `/topic/chat/{chatId}` (rooms), `/user/queue/messages` (DM) and `/topic/presence/{userId}`.
- Presence tracked in-memory per WebSocket session; scheduled tick every 10 s publishes AFK/offline changes.
- Attachments stored on the local filesystem (`/data/uploads` volume), 20 MB file / 3 MB image limit.

**Frontend** — React 18, Vite, TypeScript, Tailwind:
- Session-cookie auth (no token storage in JS).
- Zustand stores for auth/chats/presence.
- `@stomp/stompjs` for the WebSocket client, including 20 s activity heartbeat.
- Infinite-scroll message history (cursor-based, 50 per page).
- Autoscroll only when the user is already at the bottom (req 4.2).

**Infra** — `docker-compose.yml` at the repo root:
- `postgres` — PostgreSQL 16.
- `mailhog` — SMTP sink with web UI on `:8025`.
- `backend` — Spring Boot, multi-stage Dockerfile (Gradle + JRE 21).
- `frontend` — Vite build served by nginx, proxies `/api` and `/ws` to backend.

## Source layout

```
backend/
  src/main/java/com/dataart/chat/
    auth/        session auth, login/register, password reset, sessions CRUD
    user/        user entity, profile, delete-account
    chat/        rooms + DMs: entities, service, controller, invitations, queries
    friend/      friend requests, user blocks
    message/     messages, attachments metadata, STOMP broadcaster, read receipts
    attachment/  file storage service + upload/download controller
    presence/    in-memory presence service, activity heartbeat, WS event listener
    config/      SecurityConfig, WebSocketConfig
    common/      api exception + global handler
  src/main/resources/
    application.yml
    db/migration/V1__init.sql
frontend/
  src/
    api/         axios client + per-domain modules + DTO types
    ws/          STOMP client wrapper
    store/       zustand: auth, chats, presence
    pages/       LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ChatPage, ProfilePage
    features/
      rooms/     CreateRoomModal, PublicCatalogModal, ManageRoomModal
      contacts/  ContactsModal (friends, requests, add, blocked)
      messages/  MessageList, MessageComposer
      presence/  PresenceDot
    components/  UI primitives and modal wrapper
```

## Local development (optional)

If you prefer to run without Docker:
- `backend`: Java 21, then `./gradlew bootRun` in `backend/` (the wrapper downloads Gradle 8.10 automatically). You'll need a Postgres 16 instance at `localhost:5432`, database `chat`/`chat`/`chat`.
- `frontend`: `npm install && npm run dev` in `frontend/` — Vite dev server on `:5173` proxies `/api` and `/ws` to `localhost:8080`.

## Running tests

**Backend** (45 tests — JUnit 5 + embedded Postgres, no Docker required):

```bash
cd backend
./gradlew test
```

The integration suite boots a real Postgres binary via `zonky/embedded-postgres`
and runs Spring Boot tests against it. Unit tests cover token hashing, presence
state transitions, and file-storage limits.

**Frontend** (19 tests — Vitest + React Testing Library):

```bash
cd frontend
npm test              # one-shot
npm run test:watch    # watch mode
```

## Known scope limits

- The `Advanced requirements` section (Jabber/XMPP federation, §6) is **not** implemented — left as a stretch goal beyond the hackathon scope.
- Room deletion performs a soft-delete on the chat row; messages and attachments are made inaccessible but physical files are not wiped from the volume on delete.