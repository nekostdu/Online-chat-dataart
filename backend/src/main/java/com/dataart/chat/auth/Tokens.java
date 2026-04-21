package com.dataart.chat.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** Opaque random tokens for session cookies and password-reset links. */
public final class Tokens {

    private static final SecureRandom RNG = new SecureRandom();
    private static final Base64.Encoder URL_B64 = Base64.getUrlEncoder().withoutPadding();

    private Tokens() {}

    /** Returns a 256-bit URL-safe token (43 chars). */
    public static String random() {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        return URL_B64.encodeToString(bytes);
    }

    /** SHA-256 hex of the token; what we store/lookup. */
    public static String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes());
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
