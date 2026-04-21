package com.dataart.chat.user;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.auth.SessionCookie;
import com.dataart.chat.common.ApiException;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository users;

    public UserController(UserService userService, UserRepository users) {
        this.userService = userService;
        this.users = users;
    }

    @GetMapping("/{id}")
    public UserDto byId(@PathVariable Long id) {
        User u = users.findActiveById(id).orElseThrow(() -> ApiException.notFound("user"));
        return UserDto.publicOf(u);
    }

    @GetMapping("/by-username/{username}")
    public UserDto byUsername(@PathVariable String username) {
        User u = users.findActiveByUsername(username).orElseThrow(() -> ApiException.notFound("user"));
        return UserDto.publicOf(u);
    }

    @GetMapping("/search")
    public java.util.List<UserDto> search(@RequestParam("q") String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) return java.util.List.of();
        // Simple two-hit search: exact-by-username, then nothing else.
        return users.findActiveByUsername(q)
            .map(u -> java.util.List.of(UserDto.publicOf(u)))
            .orElseGet(java.util.List::of);
    }

    @DeleteMapping("/me")
    public Map<String, Object> deleteMe(HttpServletResponse res) {
        userService.deleteAccount(CurrentUser.id());
        SessionCookie.clear(res);
        return Map.of("ok", true);
    }
}
