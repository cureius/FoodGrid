package com.foodgrid.auth.service;

import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.security.SecureRandom;

@ApplicationScoped
public class OtpService {
  private static final Logger LOG = Logger.getLogger(OtpService.class);
  private static final SecureRandom RNG = new SecureRandom();

  @Inject
  Mailer mailer;

  @ConfigProperty(name = "app.email.from", defaultValue = "noreply@foodgrid.com")
  String fromEmail;

  @ConfigProperty(name = "app.email.from-name", defaultValue = "FoodGrid")
  String fromName;

  public String generateOtp(final int length) {
    final StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(RNG.nextInt(10));
    }
    return sb.toString();
  }

  public void sendOtpEmail(final String toEmail, final String otp) {
    try {
      final String subject = "FoodGrid - Your OTP Code";
      final String htmlContent = buildEmailTemplate(otp);
      
      final Mail mail = Mail.withHtml(toEmail, subject, htmlContent)
        .setFrom(fromEmail);

      mailer.send(mail);
      LOG.infof("OTP email sent successfully to %s", toEmail);
    } catch (final Exception e) {
      LOG.errorf("Failed to send OTP email to %s: %s", toEmail, e.getMessage());
      // Fallback to console logging for development
      LOG.infof("FALLBACK: OTP for customer %s is %s", toEmail, otp);
    }
  }

  private String buildEmailTemplate(final String otp) {
    return """
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FoodGrid OTP</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f4f4f4;
              }
              .container {
                  background-color: white;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 30px;
              }
              .logo {
                  font-size: 28px;
                  font-weight: bold;
                  color: #2c3e50;
                  margin-bottom: 10px;
              }
              .otp-box {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  font-size: 32px;
                  font-weight: bold;
                  text-align: center;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  letter-spacing: 5px;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .instructions {
                  text-align: center;
                  margin: 20px 0;
                  font-size: 16px;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  font-size: 12px;
                  color: #666;
              }
              .security-note {
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  color: #856404;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">🍔 FoodGrid</div>
                  <h2>Verify Your Account</h2>
              </div>
              
              <div class="instructions">
                  <p>Your One-Time Password (OTP) is:</p>
              </div>
              
              <div class="otp-box">
                  %s
              </div>
              
              <div class="instructions">
                  <p><strong>This OTP will expire in 5 minutes.</strong></p>
                  <p>Please enter this code in the application to complete your authentication.</p>
              </div>
              
              <div class="security-note">
                  <strong>🔒 Security Notice:</strong> Never share this OTP with anyone. 
                  FoodGrid employees will never ask for your OTP.
              </div>
              
              <div class="footer">
                  <p>If you didn't request this OTP, please ignore this email.</p>
                  <p>&copy; 2024 FoodGrid. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
      """.formatted(otp);
  }

  public void sendOtpSms(final String mobileNumber, final String otp) {
    // Stub: replace with real SMS gateway integration (e.g., Twilio, AWS SNS, etc.)
    // For now, log to console for development
    LOG.infof("Sending OTP SMS to %s: %s", mobileNumber, otp);
    
    // Example SMS gateway integration (commented out):
    // TwilioSmsService.sendSms(mobileNumber, String.format("Your FoodGrid OTP is: %s. Valid for 5 minutes.", otp));
    // or
    // AwsSnsService.publishSms(mobileNumber, String.format("Your FoodGrid OTP is: %s. Valid for 5 minutes.", otp));
  }

  public String maskEmail(final String email) {
    final int at = email.indexOf('@');
    if (at <= 1) return "***";
    final String local = email.substring(0, at);
    final String domain = email.substring(at);
    final String first = local.substring(0, 1);
    final String last = local.substring(local.length() - 1);
    return first + "*****" + last + domain;
  }
}
