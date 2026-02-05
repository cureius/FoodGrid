package com.foodgrid.common.exception;

/**
 * Exception for authorization failures.
 * Maps to HTTP 403 Forbidden.
 */
public class AuthorizationException extends FoodGridException {

    public AuthorizationException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
    }

    public AuthorizationException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
    }

    public static AuthorizationException accessDenied() {
        return new AuthorizationException(ErrorCode.AUTHZ_ACCESS_DENIED, "Access denied");
    }

    public static AuthorizationException accessDenied(final String resource) {
        return new AuthorizationException(ErrorCode.AUTHZ_ACCESS_DENIED, "Access denied to resource: " + resource);
    }

    public static AuthorizationException insufficientPermissions(final String requiredRole) {
        return new AuthorizationException(ErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS,
            "Insufficient permissions", "Required role: " + requiredRole);
    }

    public static AuthorizationException tenantMismatch() {
        return new AuthorizationException(ErrorCode.AUTHZ_TENANT_MISMATCH, "Resource belongs to a different tenant");
    }

    public static AuthorizationException outletMismatch() {
        return new AuthorizationException(ErrorCode.AUTHZ_OUTLET_MISMATCH, "Resource belongs to a different outlet");
    }

    public static AuthorizationException deviceMismatch() {
        return new AuthorizationException(ErrorCode.AUTHZ_DEVICE_MISMATCH, "Device is registered to a different outlet");
    }

    public static AuthorizationException sessionRevoked() {
        return new AuthorizationException(ErrorCode.AUTHZ_SESSION_REVOKED, "Session has been revoked");
    }
}
