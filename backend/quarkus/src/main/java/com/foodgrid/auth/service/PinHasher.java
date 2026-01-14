package com.foodgrid.auth.service;

import at.favre.lib.crypto.bcrypt.BCrypt;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PinHasher {
  public String hash(String value) {
    return BCrypt.withDefaults().hashToString(12, value.toCharArray());
  }

  public boolean matches(String value, String hash) {
    return BCrypt.verifyer().verify(value.toCharArray(), hash).verified;
  }
}
