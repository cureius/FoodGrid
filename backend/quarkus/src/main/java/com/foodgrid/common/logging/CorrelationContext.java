package com.foodgrid.common.logging;

import jakarta.enterprise.context.RequestScoped;
import java.util.UUID;

/**
 * Request-scoped context for correlation ID.
 * Used to trace requests across logs and services.
 */
@RequestScoped
public class CorrelationContext {

    private String correlationId;
    private String tenantId;
    private String userId;
    private String userType;
    private String outletId;

    public String getCorrelationId() {
        if (correlationId == null) {
            correlationId = generateCorrelationId();
        }
        return correlationId;
    }

    public void setCorrelationId(final String correlationId) {
        this.correlationId = correlationId;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(final String tenantId) {
        this.tenantId = tenantId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(final String userId) {
        this.userId = userId;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(final String userType) {
        this.userType = userType;
    }

    public String getOutletId() {
        return outletId;
    }

    public void setOutletId(final String outletId) {
        this.outletId = outletId;
    }

    private static String generateCorrelationId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    public String toLogContext() {
        final StringBuilder sb = new StringBuilder();
        sb.append("[corrId=").append(getCorrelationId());
        if (tenantId != null) {
            sb.append(", tenant=").append(tenantId);
        }
        if (userId != null) {
            sb.append(", user=").append(userId);
        }
        if (userType != null) {
            sb.append(", type=").append(userType);
        }
        if (outletId != null) {
            sb.append(", outlet=").append(outletId);
        }
        sb.append("]");
        return sb.toString();
    }
}
