package com.dataart.chat.auth;

import com.dataart.chat.common.ApiException;
import com.dataart.chat.user.User;
import com.dataart.chat.user.UserDto;
import com.dataart.chat.user.UserRepository;
import com.dataart.chat.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final UserRepository users;
    private final SessionService sessions;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordReset;

    public AuthController(UserService userService,
                          UserRepository users,
                          SessionService sessions,
                          PasswordEncoder passwordEncoder,
                          PasswordResetService passwordReset) {
        this.userService = userService;
        this.users = users;
        this.sessions = sessions;
        this.passwordEncoder = passwordEncoder;
        this.passwordReset = passwordReset;
    }

    public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 3, max = 32) String username,
        @NotBlank @Size(min = 8, max = 128) String password) {}

    public record LoginRequest(@NotBlank String emailOrUsername, @NotBlank String password) {}

    public record PasswordChangeRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 128) String newPassword) {}

    public record PasswordResetRequest(@Email @NotBlank String email) {}

    public record PasswordResetConfirm(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 128) String newPassword) {}

    @PostMapping("/register")
    @Transactional
    public UserDto register(@RequestBody @Valid RegisterRequest r,
                            HttpServletRequest req, HttpServletResponse res) {
        User u = userService.register(r.email(), r.username(), r.password());
        String token = sessions.createSession(u, req);
        SessionCookie.write(res, token);
        return UserDto.of(u);
    }

    @PostMapping("/login")
    public UserDto login(@RequestBody @Valid LoginRequest r,
                         HttpServletRequest req, HttpServletResponse res) {
        User u = users.findActiveByEmail(r.emailOrUsername())
            .or(() -> users.findActiveByUsername(r.emailOrUsername()))
            .orElseThrow(() -> ApiException.unauthorized("invalid credentials"));
        if (!passwordEncoder.matches(r.password(), u.getPasswordHash())) {
            throw ApiException.unauthorized("invalid credentials");
        }
        String token = sessions.createSession(u, req);
        SessionCookie.write(res, token);
        userService.markLogin(u.getId());
        return UserDto.of(u);
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletResponse res) {
        try {
            Long sid = CurrentUser.get().getSessionId();
            sessions.revoke(sid);
        } catch (ApiException ignored) {
            // not authenticated — still clear the cookie below
        }
        SessionCookie.clear(res);
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public UserDto me() {
        Long id = CurrentUser.id();
        return UserDto.of(userService.requireActive(id));
    }

    @PostMapping("/password-change")
    public Map<String, Object> changePassword(@RequestBody @Valid PasswordChangeRequest r) {
        userService.changePassword(CurrentUser.id(), r.currentPassword(), r.newPassword());
        return Map.of("ok", true);
    }

    @PostMapping("/password-reset-request")
    public Map<String, Object> resetRequest(@RequestBody @Valid PasswordResetRequest r) {
        passwordReset.requestReset(r.email());
        return Map.of("ok", true);
    }

    @PostMapping("/password-reset-confirm")
    public Map<String, Object> resetConfirm(@RequestBody @Valid PasswordResetConfirm r) {
        passwordReset.confirmReset(r.token(), r.newPassword());
        return Map.of("ok", true);
    }
}
