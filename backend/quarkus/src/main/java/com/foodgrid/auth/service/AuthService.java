package com.foodgrid.auth.service;

import com.foodgrid.auth.dto.*;
import com.foodgrid.auth.model.*;
import com.foodgrid.auth.repo.*;
import com.foodgrid.common.audit.AuditLogService;
import com.foodgrid.common.exception.*;
import com.foodgrid.common.logging.AppLogger;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@ApplicationScoped
public class AuthService {

  private static final Logger LOG = Logger.getLogger(AuthService.class);
  private static final int PIN_LENGTH = 6;
  private static final Duration OTP_TTL = Duration.ofMinutes(10);

  @Inject DeviceRepository deviceRepository;
  @Inject OutletRepository outletRepository;
  @Inject EmployeeRepository employeeRepository;
  @Inject EmployeeCredentialRepository credentialRepository;
  @Inject EmployeeRoleRepository roleRepository;
  @Inject ShiftRepository shiftRepository;
  @Inject ShiftSessionRepository sessionRepository;
  @Inject ScheduleRepository scheduleRepository;
  @Inject PinOtpChallengeRepository otpRepository;

  @Inject PinHasher pinHasher;
  @Inject OtpService otpService;
  @Inject JwtIssuer jwtIssuer;
  @Inject AuditLogService audit;
  @Inject AppLogger appLogger;

  @Transactional
  public LoginContextResponse getLoginContext(final String deviceCode, final String email) {
    appLogger.info(LOG, "DEBUG: Getting login context for email=%s, deviceCode=%s", email, deviceCode);

    // Find employee by email to determine outlet
    final Employee employee = employeeRepository.findByEmail(email)
      .orElseThrow(() -> ResourceNotFoundException.employeeByEmail(email));

    final String outletId = employee.outletId;

    final PosDevice device = deviceRepository.findByDeviceCode(deviceCode)
      .orElseGet(() -> {
        // Auto-register device for the employee's outlet
        outletRepository.findByIdOptional(outletId)
          .orElseThrow(() -> ResourceNotFoundException.outlet(outletId));

        final PosDevice d = new PosDevice();
        d.id = com.foodgrid.common.util.Ids.uuid();
        d.outletId = outletId;
        d.deviceCode = deviceCode;
        d.name = null;
        deviceRepository.persist(d);
        appLogger.info(LOG, "Auto-registered new device deviceCode=%s for outlet=%s", deviceCode, outletId);
        return d;
      });

    // Ensure device is associated with the employee's outlet
    if (!device.outletId.equals(outletId)) {
      appLogger.logSecurityWarning(LOG, "DEVICE_OUTLET_MISMATCH", "deviceCode=" + deviceCode + ", expected=" + outletId + ", actual=" + device.outletId);
      throw AuthorizationException.deviceMismatch();
    }

    final Outlet outlet = outletRepository.findByIdOptional(outletId)
      .orElseThrow(() -> ResourceNotFoundException.outlet(outletId));

    final ZoneId zone = ZoneId.of(outlet.timezone);

    final List<EmployeeListItem> employees = employeeRepository.listByOutlet(outletId).stream()
      .map(e -> {
        final var schedule = scheduleRepository.findTodaySchedule(e.id, outletId).orElse(null);
        ShiftTimeRange tr = null;
        if (schedule != null) {
          final String startTime = schedule.startAt.toInstant().atZone(zone).toLocalTime().toString();
          final String endTime = schedule.endAt.toInstant().atZone(zone).toLocalTime().toString();
          tr = new ShiftTimeRange(startTime, endTime);
        }
        return new EmployeeListItem(e.id, e.displayName, e.avatarUrl, tr);
      })
      .toList();

    return new LoginContextResponse(
      new OutletDto(outlet.id, outlet.name, outlet.timezone),
      employees,
      employee.id
    );
  }

  @Transactional
  public LoginResponse loginWithPin(final LoginWithPinRequest request) {
    appLogger.info(LOG, "PIN login attempt for employee=%s, device=%s", request.employeeId(), request.deviceId());
    validateSixDigit(request.pin());

    final PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> ResourceNotFoundException.device(request.deviceId()));

    final Outlet outlet = outletRepository.findByIdOptional(device.outletId)
      .orElseThrow(() -> ResourceNotFoundException.outlet(device.outletId));

    final Employee employee = employeeRepository.findByIdOptional(request.employeeId())
      .orElseThrow(() -> ResourceNotFoundException.employee(request.employeeId()));

    if (!employee.outletId.equals(device.outletId)) {
      appLogger.logSecurityWarning(LOG, "EMPLOYEE_OUTLET_MISMATCH", "employee=" + employee.id + ", deviceOutlet=" + device.outletId);
      throw AuthorizationException.outletMismatch();
    }

    final EmployeeCredential cred = credentialRepository.findByEmployeeId(employee.id)
      .orElseThrow(() -> AuthenticationException.invalidCredentials("PIN not configured"));

    if (cred.lockedUntil != null && cred.lockedUntil.toInstant().isAfter(Instant.now())) {
      appLogger.logSecurityEvent(LOG, "LOGIN_ATTEMPT_LOCKED_ACCOUNT", "employee=" + employee.id);
      throw AuthenticationException.accountLocked();
    }

    if (!pinHasher.matches(request.pin(), cred.pinHash)) {
      credentialRepository.incrementFailedAttempts(employee.id);
      appLogger.logSecurityEvent(LOG, "INVALID_PIN_ATTEMPT", "employee=" + employee.id);
      throw AuthenticationException.invalidPin();
    }

    credentialRepository.resetFailedAttempts(employee.id);

    final Shift shift = shiftRepository.findActive(device.outletId, employee.id, device.id)
      .orElseGet(() -> shiftRepository.createActive(device.outletId, employee.id, device.id));

    final ShiftSession session = sessionRepository.create(shift.id, device.id);

    final List<String> roles = roleRepository.listRoles(employee.id);

    // Prefer outlet.clientId if set. For legacy data, fallback to outlet.ownerId.
    final String clientId = (outlet.clientId != null && !outlet.clientId.isBlank()) ? outlet.clientId : outlet.ownerId;

    final String accessToken = jwtIssuer.issueAccessToken(employee, device.outletId, clientId, roles, session.id);
    final String refreshToken = jwtIssuer.issueRefreshToken(employee, device.outletId, clientId, session.id);

    audit.record("EMPLOYEE_LOGIN_PIN", device.outletId, "Employee", employee.id, "deviceId=" + device.id);

    return LoginResponse.from(employee, outlet, roles, shift, session, accessToken, refreshToken);
  }

  @Transactional
  public PinOtpRequestResponse requestPinOtp(final PinOtpRequest request) {
    appLogger.info(LOG, "OTP request for email=%s, device=%s", request.email(), request.deviceId());

    // Find employee by email to determine outlet
    final Employee employee = employeeRepository.findByEmail(request.email())
      .orElseThrow(() -> ResourceNotFoundException.employeeByEmail(request.email()));

    final String outletId = employee.outletId;

    final PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> ResourceNotFoundException.device(request.deviceId()));

    // Ensure device is associated with the employee's outlet
    if (!device.outletId.equals(outletId)) {
      appLogger.logSecurityWarning(LOG, "DEVICE_OUTLET_MISMATCH_OTP", "device=" + request.deviceId() + ", expected=" + outletId);
      throw AuthorizationException.deviceMismatch();
    }

    final String otp = otpService.generateOtp(PIN_LENGTH);

    final PinOtpChallenge ch = new PinOtpChallenge();
    ch.id = com.foodgrid.common.util.Ids.uuid();
    ch.employeeId = employee.id;
    ch.outletId = outletId;
    ch.otpHash = pinHasher.hash(otp);
    ch.expiresAt = java.util.Date.from(Instant.now().plus(OTP_TTL));
    ch.createdAt = java.util.Date.from(Instant.now());
    otpRepository.persist(ch);

    otpService.sendOtpEmail(employee.email, otp);

    return new PinOtpRequestResponse("SENT", ch.id, otpService.maskEmail(employee.email));
  }

  @Transactional
  public PinOtpResendResponse resendPinOtp(final PinOtpResendRequest request) {
    appLogger.info(LOG, "OTP resend request for challenge=%s", request.challengeId());

    final PinOtpChallenge ch = otpRepository.findByIdOptional(request.challengeId())
      .orElseThrow(() -> ResourceNotFoundException.challenge(request.challengeId()));

    if (ch.consumedAt != null) {
      throw BusinessException.challengeAlreadyUsed(request.challengeId());
    }
    if (ch.expiresAt.toInstant().isBefore(Instant.now())) {
      throw BusinessException.challengeExpired(request.challengeId());
    }

    final Employee employee = employeeRepository.findByIdOptional(ch.employeeId)
      .orElseThrow(() -> ResourceNotFoundException.employee(ch.employeeId));

    final String otp = otpService.generateOtp(PIN_LENGTH);
    ch.otpHash = pinHasher.hash(otp);
    ch.resendCount = ch.resendCount + 1;
    otpRepository.persist(ch);

    otpService.sendOtpEmail(employee.email, otp);

    return new PinOtpResendResponse("SENT");
  }

  @Transactional
  public LoginResponse verifyPinOtp(final PinOtpVerifyRequest request) {
    appLogger.info(LOG, "OTP verification for challenge=%s, device=%s", request.challengeId(), request.deviceId());
    validateSixDigit(request.otp());

    final PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> ResourceNotFoundException.device(request.deviceId()));

    final Outlet outlet = outletRepository.findByIdOptional(device.outletId)
      .orElseThrow(() -> ResourceNotFoundException.outlet(device.outletId));

    final PinOtpChallenge ch = otpRepository.findByIdOptional(request.challengeId())
      .orElseThrow(() -> ResourceNotFoundException.challenge(request.challengeId()));

    if (!ch.outletId.equals(device.outletId)) {
      appLogger.logSecurityWarning(LOG, "CHALLENGE_OUTLET_MISMATCH", "challenge=" + ch.id + ", deviceOutlet=" + device.outletId);
      throw AuthorizationException.outletMismatch();
    }

    if (ch.consumedAt != null) {
      throw BusinessException.challengeAlreadyUsed(request.challengeId());
    }
    if (ch.expiresAt.toInstant().isBefore(Instant.now())) {
      throw BusinessException.challengeExpired(request.challengeId());
    }

    if (!pinHasher.matches(request.otp(), ch.otpHash)) {
      appLogger.logSecurityEvent(LOG, "INVALID_OTP_ATTEMPT", "challenge=" + ch.id);
      throw AuthenticationException.invalidOtp();
    }

    ch.consumedAt = java.util.Date.from(Instant.now());
    otpRepository.persist(ch);

    final Employee employee = employeeRepository.findByIdOptional(ch.employeeId)
      .orElseThrow(() -> ResourceNotFoundException.employee(ch.employeeId));

    final Shift shift = shiftRepository.findActive(device.outletId, employee.id, device.id)
      .orElseGet(() -> shiftRepository.createActive(device.outletId, employee.id, device.id));

    final ShiftSession session = sessionRepository.create(shift.id, device.id);

    final List<String> roles = roleRepository.listRoles(employee.id);

    final String clientId = (outlet.clientId != null && !outlet.clientId.isBlank()) ? outlet.clientId : outlet.ownerId;

    final String accessToken = jwtIssuer.issueAccessToken(employee, device.outletId, clientId, roles, session.id);
    final String refreshToken = jwtIssuer.issueRefreshToken(employee, device.outletId, clientId, session.id);

    audit.record("EMPLOYEE_LOGIN_OTP", device.outletId, "Employee", employee.id, "deviceId=" + device.id);

    return LoginResponse.from(employee, outlet, roles, shift, session, accessToken, refreshToken);
  }

  private static void validateSixDigit(final String value) {
    if (value == null || value.length() != PIN_LENGTH || !value.chars().allMatch(Character::isDigit)) {
      throw ValidationException.invalidPinFormat();
    }
  }
}
