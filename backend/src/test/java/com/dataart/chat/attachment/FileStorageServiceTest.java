package com.dataart.chat.attachment;

import com.dataart.chat.common.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    private static final long MAX_FILE  = 20 * 1024 * 1024;
    private static final long MAX_IMAGE = 3  * 1024 * 1024;

    @Test
    void storesFileUnderRoot(@TempDir Path root) throws IOException {
        FileStorageService svc = new FileStorageService(root.toString(), MAX_FILE, MAX_IMAGE);
        MockMultipartFile f = new MockMultipartFile("file", "report.txt", "text/plain", "hello".getBytes());
        FileStorageService.StoredFile stored = svc.store(f);
        assertThat(stored.sizeBytes()).isEqualTo(5L);
        assertThat(Files.exists(stored.storedPath())).isTrue();
        assertThat(stored.storedPath().startsWith(root)).isTrue();
        assertThat(stored.relativePath()).endsWith("_report.txt");
        assertThat(stored.image()).isFalse();
    }

    @Test
    void detectsImagesAndEnforcesImageLimit(@TempDir Path root) throws IOException {
        FileStorageService svc = new FileStorageService(root.toString(), MAX_FILE, MAX_IMAGE);
        byte[] payload = new byte[(int) MAX_IMAGE + 1];
        MockMultipartFile big = new MockMultipartFile("file", "huge.png", "image/png", payload);
        assertThatThrownBy(() -> svc.store(big))
            .isInstanceOf(ApiException.class).hasMessageContaining("image");
    }

    @Test
    void enforcesFileLimit(@TempDir Path root) throws IOException {
        FileStorageService svc = new FileStorageService(root.toString(), MAX_FILE, MAX_IMAGE);
        byte[] payload = new byte[(int) MAX_FILE + 1];
        MockMultipartFile big = new MockMultipartFile("file", "huge.bin", "application/octet-stream", payload);
        assertThatThrownBy(() -> svc.store(big))
            .isInstanceOf(ApiException.class).hasMessageContaining("20 MB");
    }

    @Test
    void rejectsEmptyFile(@TempDir Path root) throws IOException {
        FileStorageService svc = new FileStorageService(root.toString(), MAX_FILE, MAX_IMAGE);
        MockMultipartFile empty = new MockMultipartFile("file", "x.txt", "text/plain", new byte[0]);
        assertThatThrownBy(() -> svc.store(empty)).isInstanceOf(ApiException.class);
    }

    @Test
    void sanitisesOriginalNameInRelativePath(@TempDir Path root) throws IOException {
        FileStorageService svc = new FileStorageService(root.toString(), MAX_FILE, MAX_IMAGE);
        MockMultipartFile f = new MockMultipartFile("file", "../../bad name.txt", "text/plain", "x".getBytes());
        FileStorageService.StoredFile stored = svc.store(f);
        assertThat(stored.relativePath()).doesNotContain("/.." );
        assertThat(stored.relativePath()).endsWith("_.._.._bad_name.txt");
    }
}
