package com.dataart.chat.attachment;

import com.dataart.chat.auth.CurrentUser;
import com.dataart.chat.chat.Chat;
import com.dataart.chat.chat.ChatService;
import com.dataart.chat.common.ApiException;
import com.dataart.chat.message.Attachment;
import com.dataart.chat.message.AttachmentRepository;
import com.dataart.chat.message.Message;
import com.dataart.chat.message.MessageRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final FileStorageService storage;
    private final AttachmentRepository attachments;
    private final MessageRepository messages;
    private final ChatService chatService;

    public AttachmentController(FileStorageService storage,
                                AttachmentRepository attachments,
                                MessageRepository messages,
                                ChatService chatService) {
        this.storage = storage;
        this.attachments = attachments;
        this.messages = messages;
        this.chatService = chatService;
    }

    @PostMapping
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "comment", required = false) String comment) {
        FileStorageService.StoredFile stored = storage.store(file);
        Attachment a = new Attachment();
        a.setUploadedBy(CurrentUser.id());
        a.setOriginalName(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        a.setStoredPath(stored.relativePath());
        a.setMimeType(stored.mimeType());
        a.setSizeBytes(stored.sizeBytes());
        a.setImage(stored.image());
        if (comment != null && !comment.isBlank()) a.setComment(comment);
        attachments.save(a);
        return Map.of(
            "id", a.getId(),
            "originalName", a.getOriginalName(),
            "mimeType", a.getMimeType(),
            "sizeBytes", a.getSizeBytes(),
            "isImage", a.isImage());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) throws IOException {
        Attachment a = attachments.findById(id).orElseThrow(() -> ApiException.notFound("attachment"));
        Long viewer = CurrentUser.id();
        // Uploader of an unattached draft can always download it.
        if (a.getMessageId() == null) {
            if (!viewer.equals(a.getUploadedBy())) throw ApiException.forbidden("not your upload");
        } else {
            Message m = messages.findById(a.getMessageId())
                .orElseThrow(() -> ApiException.notFound("message"));
            Chat c = chatService.requireActive(m.getChatId());
            chatService.requireMember(c, viewer);
        }

        Path path = storage.resolve(a.getStoredPath());
        if (!Files.exists(path)) throw ApiException.notFound("file missing");

        MediaType type = MediaType.APPLICATION_OCTET_STREAM;
        try { if (a.getMimeType() != null) type = MediaType.parseMediaType(a.getMimeType()); }
        catch (Exception ignore) { /* fall back to octet-stream */ }

        ContentDisposition disposition = ContentDisposition.builder(a.isImage() ? "inline" : "attachment")
            .filename(a.getOriginalName())
            .build();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .contentType(type)
            .contentLength(a.getSizeBytes())
            .body(new InputStreamResource(Files.newInputStream(path)));
    }
}
