package com.dataart.chat.attachment;

import com.dataart.chat.common.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/** Writes uploaded files to the local filesystem. Req 3.4. */
@Service
public class FileStorageService {

    private static final Set<String> IMAGE_MIME = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/svg+xml");

    private final Path root;
    private final long maxFileBytes;
    private final long maxImageBytes;

    public FileStorageService(@Value("${chat.uploads-dir}") String uploadsDir,
                              @Value("${chat.max-file-bytes}")  long maxFileBytes,
                              @Value("${chat.max-image-bytes}") long maxImageBytes) throws IOException {
        this.root = Paths.get(uploadsDir).toAbsolutePath().normalize();
        this.maxFileBytes = maxFileBytes;
        this.maxImageBytes = maxImageBytes;
        Files.createDirectories(this.root);
    }

    public record StoredFile(Path storedPath, String relativePath, long sizeBytes, String mimeType, boolean image) {}

    public StoredFile store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("empty file");

        String mime = file.getContentType();
        boolean image = mime != null && IMAGE_MIME.contains(mime.toLowerCase());
        long limit = image ? maxImageBytes : maxFileBytes;
        if (file.getSize() > limit) {
            throw new com.dataart.chat.common.ApiException(
                org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE,
                image ? "image exceeds 3 MB" : "file exceeds 20 MB");
        }

        LocalDate today = LocalDate.now();
        String sub = String.format("%04d/%02d", today.getYear(), today.getMonthValue());
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String safeName = sanitize(file.getOriginalFilename());
        String relative = sub + "/" + uuid + "_" + safeName;
        Path target = root.resolve(relative).normalize();
        if (!target.startsWith(root)) throw ApiException.badRequest("invalid path");

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException e) {
            throw new RuntimeException("failed to store file", e);
        }

        return new StoredFile(target, relative, file.getSize(), mime, image);
    }

    public Path resolve(String relative) {
        Path p = root.resolve(relative).normalize();
        if (!p.startsWith(root)) throw ApiException.forbidden("bad path");
        return p;
    }

    /** Best-effort unlink. Never throws — callers log + continue. */
    public boolean deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return false;
        try {
            Path p = resolve(relativePath);
            return Files.deleteIfExists(p);
        } catch (Exception e) {
            return false;
        }
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        String cleaned = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (cleaned.length() > 100) cleaned = cleaned.substring(0, 100);
        return cleaned;
    }
}
