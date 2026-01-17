package com.foodgrid.common.multitenancy;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class TenantContext {

  private String tenantId;

  public String getTenantId() {
    return tenantId;
  }

  public void setTenantId(final String tenantId) {
    this.tenantId = tenantId;
  }

  public boolean hasTenant() {
    return tenantId != null && !tenantId.isBlank();
  }
}
