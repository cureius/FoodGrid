package com.foodgrid.common.util;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

/**
 * AES-256-GCM encryption utility for sensitive data like payment credentials.
 * Uses PBKDF2 for key derivation from master key.
 */
@ApplicationScoped
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int ITERATION_COUNT = 65536;
    private static final int KEY_LENGTH = 256;
    private static final byte[] SALT = "FoodGridPaymentSalt2024".getBytes(StandardCharsets.UTF_8);

    @ConfigProperty(name = "foodgrid.encryption.master-key", defaultValue = "default-dev-master-key-change-in-prod")
    String masterKey;

    private SecretKey deriveKey() {
        try {
            final SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            final KeySpec spec = new PBEKeySpec(masterKey.toCharArray(), SALT, ITERATION_COUNT, KEY_LENGTH);
            final SecretKey tmp = factory.generateSecret(spec);
            return new SecretKeySpec(tmp.getEncoded(), "AES");
        } catch (final Exception e) {
            throw new RuntimeException("Failed to derive encryption key", e);
        }
    }

    /**
     * Encrypt a plaintext string.
     * @param plaintext The text to encrypt
     * @return Base64 encoded ciphertext (IV + encrypted data)
     */
    public String encrypt(final String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }
        try {
            final SecretKey key = deriveKey();
            final Cipher cipher = Cipher.getInstance(ALGORITHM);

            // Generate random IV
            final byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            final GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
            final byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Prepend IV to ciphertext
            final ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (final Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypt a ciphertext string.
     * @param ciphertext Base64 encoded ciphertext (IV + encrypted data)
     * @return Decrypted plaintext
     */
    public String decrypt(final String ciphertext) {
        if (ciphertext == null || ciphertext.isBlank()) {
            return null;
        }
        try {
            final SecretKey key = deriveKey();
            final byte[] decoded = Base64.getDecoder().decode(ciphertext);

            // Extract IV and ciphertext
            final ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            final byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            final byte[] encrypted = new byte[byteBuffer.remaining()];
            byteBuffer.get(encrypted);

            final Cipher cipher = Cipher.getInstance(ALGORITHM);
            final GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (final Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
