package com.foodgrid.auth.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.security.SecureRandom;

@ApplicationScoped
public class OtpService {
  private static final Logger LOG = Logger.getLogger(OtpService.class);
  private static final SecureRandom RNG = new SecureRandom();

  public String generateOtp(int length) {
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(RNG.nextInt(10));
    }
    return sb.toString();
  }

  public void sendOtpEmail(String toEmail, String otp) {
    // Stub: replace with real SMTP provider integration.
    LOG.infof("Sending OTP to %s: %s", toEmail, otp);
  }

  public void sendOtpSms(String mobileNumber, String otp) {
    // Stub: replace with real SMS gateway integration (e.g., Twilio, AWS SNS, etc.)
    // For now, log to console for development
    LOG.infof("Sending OTP SMS to %s: %s", mobileNumber, otp);
    
    // Example SMS gateway integration (commented out):
    // TwilioSmsService.sendSms(mobileNumber, String.format("Your FoodGrid OTP is: %s. Valid for 5 minutes.", otp));
    // or
    // AwsSnsService.publishSms(mobileNumber, String.format("Your FoodGrid OTP is: %s. Valid for 5 minutes.", otp));
  }

  public String maskEmail(String email) {
    int at = email.indexOf('@');
    if (at <= 1) return "***";
    String local = email.substring(0, at);
    String domain = email.substring(at);
    String first = local.substring(0, 1);
    String last = local.substring(local.length() - 1);
    return first + "*****" + last + domain;
  }
}
