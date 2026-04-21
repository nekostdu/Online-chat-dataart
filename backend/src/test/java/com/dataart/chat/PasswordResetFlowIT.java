package com.dataart.chat;

import static org.assertj.core.api.Assertions.assertThat;

import com.dataart.chat.user.UserDto;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Full password-reset flow: request → SMTP capture via GreenMail → confirm → login with new password.
 * Covers Requirement 2.1.4.
 */
class PasswordResetFlowIT extends AbstractIT {

    @RegisterExtension
    static final GreenMailExtension GREEN = new GreenMailExtension(ServerSetupTest.SMTP);

    private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]+)");

    @Autowired TestRestTemplate rest;
    @Autowired TestDb db;

    @BeforeEach
    void clean() throws Exception {
        db.wipe();
        GREEN.purgeEmailFromAllMailboxes();
    }

    @Test
    void requestSendsEmailAndConfirmAllowsNewPasswordLogin() throws Exception {
        // 1. register
        rest.postForEntity("/api/auth/register",
            json("{\"email\":\"alice@x.io\",\"username\":\"alice\",\"password\":\"oldpass12\"}"),
            UserDto.class);

        // 2. request a reset — server queues an SMTP message
        ResponseEntity<String> reset = rest.postForEntity("/api/auth/password-reset-request",
            json("{\"email\":\"alice@x.io\"}"), String.class);
        assertThat(reset.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(GREEN.waitForIncomingEmail(5_000, 1)).isTrue();

        MimeMessage[] messages = GREEN.getReceivedMessages();
        assertThat(messages).hasSize(1);
        String body = GreenMailUtil.getBody(messages[0]);
        Matcher m = TOKEN.matcher(body);
        assertThat(m.find()).as("email body should contain reset token").isTrue();
        String token = m.group(1);

        // 3. confirm the reset
        ResponseEntity<String> confirm = rest.postForEntity("/api/auth/password-reset-confirm",
            json("{\"token\":\"" + token + "\",\"newPassword\":\"brandnew77\"}"), String.class);
        assertThat(confirm.getStatusCode()).isEqualTo(HttpStatus.OK);

        // 4. logging in with the new password works
        ResponseEntity<UserDto> login = rest.postForEntity("/api/auth/login",
            json("{\"emailOrUsername\":\"alice\",\"password\":\"brandnew77\"}"),
            UserDto.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void confirmWithUsedTokenIsRejected() throws Exception {
        rest.postForEntity("/api/auth/register",
            json("{\"email\":\"bob@x.io\",\"username\":\"bob\",\"password\":\"oldpass12\"}"),
            UserDto.class);
        rest.postForEntity("/api/auth/password-reset-request",
            json("{\"email\":\"bob@x.io\"}"), String.class);
        assertThat(GREEN.waitForIncomingEmail(5_000, 1)).isTrue();
        String body = GreenMailUtil.getBody(GREEN.getReceivedMessages()[0]);
        String token = extractToken(body);

        // first confirm — succeeds
        assertThat(rest.postForEntity("/api/auth/password-reset-confirm",
            json("{\"token\":\"" + token + "\",\"newPassword\":\"brandnew77\"}"),
            String.class).getStatusCode()).isEqualTo(HttpStatus.OK);

        // second confirm with the same token — rejected
        ResponseEntity<String> again = rest.exchange("/api/auth/password-reset-confirm",
            HttpMethod.POST,
            json("{\"token\":\"" + token + "\",\"newPassword\":\"anotherone\"}"),
            String.class);
        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void requestForUnknownEmailDoesNotSendMessageButReturnsOk() {
        ResponseEntity<String> r = rest.postForEntity("/api/auth/password-reset-request",
            json("{\"email\":\"nobody@nowhere.io\"}"), String.class);
        // anti-enumeration: server still responds 200
        assertThat(r.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(GREEN.getReceivedMessages()).isEmpty();
    }

    private static String extractToken(String body) {
        Matcher m = TOKEN.matcher(body);
        if (!m.find()) throw new IllegalStateException("token not found in: " + body);
        return m.group(1);
    }

    private static HttpEntity<String> json(String body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }
}
