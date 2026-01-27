package com.foodgrid.auth.service;

import com.foodgrid.auth.dto.CustomerAuthDto.*;
import com.foodgrid.auth.model.Customer;
import com.foodgrid.auth.model.CustomerOtpChallenge;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import io.smallrye.mutiny.Uni;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.ws.rs.NotAuthorizedException;
import java.util.Collections;

@ApplicationScoped
public class CustomerAuthService {

    private static final int OTP_LENGTH = 6;
    private static final Duration OTP_TTL = Duration.ofMinutes(5);

    @Inject OtpService otpService;
    @Inject PinHasher pinHasher;
    @Inject JwtIssuer jwtIssuer;

    @ConfigProperty(name = "google.client.id")
    String googleClientId;

    @Transactional
    public void requestOtp(final RequestOtpRequest request) {
        final String otp = otpService.generateOtp(OTP_LENGTH);
        
        final CustomerOtpChallenge challenge = new CustomerOtpChallenge();
        challenge.mobileNumber = request.mobileNumber;
        challenge.email = null; // Not used for mobile OTP
        challenge.challengeType = "MOBILE";
        challenge.otpHash = pinHasher.hash(otp);
        challenge.expiresAt = Date.from(Instant.now().plus(OTP_TTL));
        challenge.persist();

        // In production, send via SMS gateway. For now, log to console.
        System.out.println("DEBUG: OTP for customer " + request.mobileNumber + " is " + otp);
        otpService.sendOtpSms(request.mobileNumber, otp);
    }

    @Transactional
    public Uni<Void> requestEmailOtp(final RequestEmailOtpRequest request) {
        final String otp = otpService.generateOtp(OTP_LENGTH);
        
        final CustomerOtpChallenge challenge = new CustomerOtpChallenge();
        challenge.mobileNumber = null; // Not used for email OTP
        challenge.email = request.email;
        challenge.challengeType = "EMAIL";
        challenge.otpHash = pinHasher.hash(otp);
        challenge.expiresAt = Date.from(Instant.now().plus(OTP_TTL));
        challenge.persist();

        // Send OTP via email asynchronously after transaction commits
        System.out.println("DEBUG: Email OTP for customer " + request.email + " is " + otp);
        return otpService.sendOtpEmail(request.email, otp)
            .onFailure().invoke(e -> {
                // Log error but don't fail the entire request
                System.err.println("Failed to send OTP email: " + e.getMessage());
            })
            .replaceWithVoid();
    }

    @Transactional
    public CustomerLoginResponse verifyOtp(final VerifyOtpRequest request) {
        final CustomerOtpChallenge challenge = CustomerOtpChallenge.findLatestByMobile(request.mobileNumber);
        
        if (challenge == null) {
            throw new NotFoundException("No active OTP request found for this number");
        }

        if (challenge.expiresAt.before(new Date())) {
            throw new BadRequestException("OTP expired");
        }

        if (!pinHasher.matches(request.otp, challenge.otpHash)) {
            throw new ForbiddenException("Invalid OTP");
        }

        challenge.consumedAt = new Date();
        challenge.persist();

        // Find or create customer
        Customer customer = Customer.findByMobile(request.mobileNumber);
        if (customer == null) {
            customer = new Customer();
            customer.mobileNumber = request.mobileNumber;
            customer.displayName = "Customer " + request.mobileNumber.substring(6);
            customer.persist();
        }

        customer.lastLoginAt = new Date();
        customer.persist();

        final String token = jwtIssuer.issueCustomerAccessToken(customer);
        
        final CustomerLoginResponse response = new CustomerLoginResponse();
        response.token = token;
        response.profile = new CustomerProfile();
        response.profile.id = customer.id;
        response.profile.mobileNumber = customer.mobileNumber;
        response.profile.email = customer.email;
        response.profile.displayName = customer.displayName;
        response.profile.avatarUrl = customer.avatarUrl;

        return response;
    }

    @Transactional
    public CustomerLoginResponse verifyEmailOtp(final VerifyEmailOtpRequest request) {
        final CustomerOtpChallenge challenge = CustomerOtpChallenge.findLatestByEmail(request.email);
        
        if (challenge == null) {
            throw new NotFoundException("No active OTP request found for this email");
        }

        if (challenge.expiresAt.before(new Date())) {
            throw new BadRequestException("OTP expired");
        }

        if (!pinHasher.matches(request.otp, challenge.otpHash)) {
            throw new ForbiddenException("Invalid OTP");
        }

        challenge.consumedAt = new Date();
        challenge.persist();

        // Find or create customer
        Customer customer = Customer.findByEmail(request.email);
        if (customer == null) {
            customer = new Customer();
            customer.email = request.email;
            customer.displayName = "Customer " + request.email.substring(0, request.email.indexOf('@'));
            customer.persist();
        }

        customer.lastLoginAt = new Date();
        customer.persist();

        final String token = jwtIssuer.issueCustomerAccessToken(customer);
        
        final CustomerLoginResponse response = new CustomerLoginResponse();
        response.token = token;
        response.profile = new CustomerProfile();
        response.profile.id = customer.id;
        response.profile.mobileNumber = customer.mobileNumber;
        response.profile.email = customer.email;
        response.profile.displayName = customer.displayName;
        response.profile.avatarUrl = customer.avatarUrl;

        return response;
    }

    @Transactional
    public CustomerLoginResponse verifyGoogleToken(final VerifyGoogleTokenRequest request) {
        final GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        final GoogleIdToken idToken;
        try {
            idToken = verifier.verify(request.idToken);
        } catch (Exception e) {
            throw new NotAuthorizedException("Failed to verify Google Token", "Bearer");
        }

        if (idToken == null) {
            throw new NotAuthorizedException("Invalid Google Token", "Bearer");
        }

        final GoogleIdToken.Payload payload = idToken.getPayload();
        
        // Email verification check
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ForbiddenException("Email not verified by Google");
        }

        final String email = payload.getEmail();
        final String name = (String) payload.get("name");
        final String googleSub = payload.getSubject();
        final String pictureUrl = (String) payload.get("picture");

        // Find existing user by email
        Customer customer = Customer.findByEmail(email);
        if (customer == null) {
            customer = new Customer();
            customer.email = email;
            customer.displayName = name;
            customer.provider = "GOOGLE";
            customer.providerUserId = googleSub;
            customer.avatarUrl = pictureUrl;
            customer.persist();
        }

        customer.lastLoginAt = new Date();
        customer.persist();

        final String token = jwtIssuer.issueCustomerAccessToken(customer);
        
        final CustomerLoginResponse response = new CustomerLoginResponse();
        response.token = token;
        response.profile = new CustomerProfile();
        response.profile.id = customer.id;
        response.profile.mobileNumber = customer.mobileNumber;
        response.profile.email = customer.email;
        response.profile.displayName = customer.displayName;
        response.profile.avatarUrl = customer.avatarUrl;

        return response;
    }
}
