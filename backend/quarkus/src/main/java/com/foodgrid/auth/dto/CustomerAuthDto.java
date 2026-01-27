package com.foodgrid.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;

public class CustomerAuthDto {

    public static class RequestOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$", message = "Invalid mobile number")
        public String mobileNumber;
    }

    public static class RequestEmailOtpRequest {
        @NotBlank
        @Email(message = "Invalid email address")
        public String email;
    }

    public static class VerifyOtpRequest {
        @NotBlank
        @Pattern(regexp = "^[0-9]{10}$", message = "Invalid mobile number")
        public String mobileNumber;

        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$", message = "Invalid OTP")
        public String otp;
    }

    public static class VerifyEmailOtpRequest {
        @NotBlank
        @Email(message = "Invalid email address")
        public String email;

        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$", message = "Invalid OTP")
        public String otp;
    }

    public static class VerifyGoogleTokenRequest {
        @NotBlank
        public String idToken;
    }

    public static class CustomerLoginResponse {
        public String token;
        public CustomerProfile profile;
    }

    public static class CustomerProfile {
        public String id;
        public String mobileNumber;
        public String email;
        public String displayName;
        public String avatarUrl;
    }
}
