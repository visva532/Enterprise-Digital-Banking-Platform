package com.fincore.kyc.service;

import com.fincore.kyc.enums.KycEnums.DocumentKind;
import com.fincore.kyc.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_BYTES = 2L * 1024 * 1024;

    public record Stored(String fileName, String contentType) {}

    public record DocumentFile(byte[] bytes, String contentType) {}

    private final Path root;

    public FileStorageService(@Value("${app.kyc.storage-dir}") String dir) {
        this.root = Path.of(dir).toAbsolutePath().normalize();
    }

    public Stored save(String applicationId, DocumentKind kind, MultipartFile file) {
        String label = kind == DocumentKind.SELFIE ? "The selfie" : "The ID proof";
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, label + " is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, label + " must be 2 MB or smaller");
        }
        try {
            byte[] bytes = file.getBytes();

            // The type comes from the real file bytes, never from the file name the browser sent
            String type = detectType(bytes);
            boolean allowed = type != null && !(kind == DocumentKind.SELFIE && type.equals("application/pdf"));
            if (!allowed) {
                throw new ApiException(HttpStatus.BAD_REQUEST, label + (kind == DocumentKind.SELFIE
                        ? " must be a JPEG or PNG image" : " must be a JPEG, PNG or PDF file"));
            }

            Path dir = root.resolve(applicationId).normalize();
            if (!dir.startsWith(root)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid application");
            }
            Files.createDirectories(dir);

            String prefix = kind.name().toLowerCase();                  // id_proof or selfie
            for (String ext : new String[]{".jpg", ".png", ".pdf"}) {   // replace an earlier upload
                Files.deleteIfExists(dir.resolve(prefix + ext));
            }
            String fileName = prefix + extension(type);
            Files.write(dir.resolve(fileName), bytes);
            return new Stored(fileName, type);
        } catch (IOException e) {
            log.error("Could not store a KYC document", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store the document. Please try again.");
        }
    }

    public byte[] readBytes(String applicationId, String fileName) {
        if (fileName == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document not found");
        }
        try {
            Path file = root.resolve(applicationId).resolve(fileName).normalize();
            if (!file.startsWith(root)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid document");
            }
            return Files.readAllBytes(file);
        } catch (NoSuchFileException e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document not found");
        } catch (IOException e) {
            log.error("Could not read a KYC document", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read the document");
        }
    }

    private static String detectType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "image/png";
        }
        if (b.length >= 4 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F') {
            return "application/pdf";
        }
        return null;
    }

    private static String extension(String type) {
        return switch (type) {
            case "image/png" -> ".png";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
    }
}