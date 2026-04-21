package com.dataart.chat.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mail;
    private final String fromAddress;
    private final String appBaseUrl;

    public MailService(JavaMailSender mail,
                       @Value("${chat.mail.from:noreply@chat.local}") String fromAddress,
                       @Value("${chat.app-base-url:http://localhost:8080}") String appBaseUrl) {
        this.mail = mail;
        this.fromAddress = fromAddress;
        this.appBaseUrl = appBaseUrl;
    }

    public void sendPasswordReset(String to, String rawToken) {
        String url = appBaseUrl + "/reset-password?token=" + rawToken;
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject("Reset your password");
        msg.setText("""
            Hello,

            We received a request to reset your password. Use the link below:

            %s

            The link is valid for 1 hour. If you didn't request this, ignore this email.
            """.formatted(url));
        try {
            mail.send(msg);
        } catch (Exception e) {
            log.warn("failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }
}
