package com.foodgrid.common.util;

import java.util.UUID;

public final class Ids {
  private Ids() {}

  public static String uuid() {
    return UUID.randomUUID().toString();
  }
}
