package com.foodgrid.common.exception;

/**
 * Exception for authentication failures.
 * Maps to HTTP 401 Unauthorized.
 */
public class AuthenticationException extends FoodGridException {

    public AuthenticationException(final ErrorCode errorCode, final String message) {
        super(errorCode, message);
    }

    public AuthenticationException(final ErrorCode errorCode, final String message, final String details) {
        super(errorCode, message, details);
    }

    public static AuthenticationException invalidCredentials() {
        return new AuthenticationException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials");
    }

    public static AuthenticationException invalidCredentials(final String details) {
        return new AuthenticationException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials", details);
    }

    public static AuthenticationException tokenExpired() {
        return new AuthenticationException(ErrorCode.AUTH_TOKEN_EXPIRED, "Token has expired");
    }

    public static AuthenticationException invalidToken() {
        return new AuthenticationException(ErrorCode.AUTH_TOKEN_INVALID, "Invalid authentication token");
    }

    public static AuthenticationException missingToken() {
        return new AuthenticationException(ErrorCode.AUTH_MISSING_TOKEN, "Authentication required");
    }

    public static AuthenticationException invalidOtp() {
        return new AuthenticationException(ErrorCode.AUTH_OTP_INVALID, "Invalid OTP code");
    }

    public static AuthenticationException otpExpired() {
        return new AuthenticationException(ErrorCode.AUTH_OTP_EXPIRED, "OTP has expired");
    }

    public static AuthenticationException invalidPin() {
        return new AuthenticationException(ErrorCode.AUTH_PIN_INVALID, "Invalid PIN");
    }

    public static AuthenticationException accountLocked() {
        return new AuthenticationException(ErrorCode.AUTH_ACCOUNT_LOCKED, "Account is locked due to too many failed attempts");
    }
}
