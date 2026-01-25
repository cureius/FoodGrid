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

@ApplicationScoped
public class CustomerAuthService {

    private static final int OTP_LENGTH = 6;
    private static final Duration OTP_TTL = Duration.ofMinutes(5);

    @Inject OtpService otpService;
    @Inject PinHasher pinHasher;
    @Inject JwtIssuer jwtIssuer;

    @Transactional
    public void requestOtp(RequestOtpRequest request) {
        String otp = otpService.generateOtp(OTP_LENGTH);
        
        CustomerOtpChallenge challenge = new CustomerOtpChallenge();
        challenge.mobileNumber = request.mobileNumber;
        challenge.otpHash = pinHasher.hash(otp);
        challenge.expiresAt = Date.from(Instant.now().plus(OTP_TTL));
        challenge.persist();

        // In production, send via SMS gateway. For now, log to console.
        System.out.println("DEBUG: OTP for customer " + request.mobileNumber + " is " + otp);
        // otpService.sendOtpSms(request.mobileNumber, otp);
    }

    @Transactional
    public CustomerLoginResponse verifyOtp(VerifyOtpRequest request) {
        CustomerOtpChallenge challenge = CustomerOtpChallenge.findLatest(request.mobileNumber);
        
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

        String token = jwtIssuer.issueCustomerAccessToken(customer);
        
        CustomerLoginResponse response = new CustomerLoginResponse();
        response.token = token;
        response.profile = new CustomerProfile();
        response.profile.id = customer.id;
        response.profile.mobileNumber = customer.mobileNumber;
        response.profile.displayName = customer.displayName;
        response.profile.avatarUrl = customer.avatarUrl;

        return response;
    }
}
