package com.dataart.chat.auth;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TokensTest {

    @Test
    void randomTokensAreDistinctAndUrlSafe() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            String t = Tokens.random();
            assertThat(t).hasSizeGreaterThanOrEqualTo(40);
            assertThat(t).matches("[A-Za-z0-9_-]+");
            assertThat(seen.add(t)).as("duplicate token produced").isTrue();
        }
    }

    @Test
    void hashIsDeterministicAndHex64() {
        String t = "some-token";
        assertThat(Tokens.hash(t)).hasSize(64).matches("[0-9a-f]{64}");
        assertThat(Tokens.hash(t)).isEqualTo(Tokens.hash(t));
        assertThat(Tokens.hash(t)).isNotEqualTo(Tokens.hash(t + "1"));
    }
}
