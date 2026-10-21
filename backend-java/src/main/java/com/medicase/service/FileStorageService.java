package com.medicase.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {
    private static final Set<String> EXT = Set.of("pdf", "png", "jpg", "jpeg");
    private final Path root;

    public FileStorageService(@Value("${medicase.storage.path}") String path) throws IOException {
        this.root = Path.of(path).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    /** Stores under a random name, so user-supplied file names never touch the file system. */
    public Path store(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Please choose a file to upload");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dot = name.lastIndexOf('.');
        String ext = dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!EXT.contains(ext)) throw new IllegalArgumentException("Only PDF, PNG or JPG files are allowed");
        Path target = root.resolve(UUID.randomUUID() + "." + ext).normalize();
        if (!target.startsWith(root)) throw new IllegalArgumentException("Invalid file name");
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Could not save the file", e);
        }
        return target;
    }
}
