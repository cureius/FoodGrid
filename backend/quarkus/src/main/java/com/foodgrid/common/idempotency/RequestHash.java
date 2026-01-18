package com.foodgrid.common.idempotency;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class RequestHash {
  private RequestHash() {}

  public static String sha256Hex(final String input) {
    try {
      final MessageDigest md = MessageDigest.getInstance("SHA-256");
      final byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
      final StringBuilder sb = new StringBuilder(digest.length * 2);
      for (final byte b : digest) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (final Exception e) {
      throw new RuntimeException("Unable to hash request", e);
    }
  }
}
