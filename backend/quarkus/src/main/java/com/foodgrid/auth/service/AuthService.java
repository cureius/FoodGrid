package com.foodgrid.auth.service;

import com.foodgrid.auth.dto.*;
import com.foodgrid.auth.model.*;
import com.foodgrid.auth.repo.*;
import com.foodgrid.common.security.JwtIssuer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@ApplicationScoped
public class AuthService {

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

  public LoginContextResponse getLoginContext(String deviceCode) {
    PosDevice device = deviceRepository.findByDeviceCode(deviceCode)
      .orElseThrow(() -> new NotFoundException("Unknown device"));

    Outlet outlet = outletRepository.findByIdOptional(device.outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    ZoneId zone = ZoneId.of(outlet.timezone);

    List<EmployeeListItem> employees = employeeRepository.listByOutlet(device.outletId).stream()
      .map(e -> {
        var schedule = scheduleRepository.findTodaySchedule(e.id, device.outletId).orElse(null);
        ShiftTimeRange tr = null;
        if (schedule != null) {
          String startTime = schedule.startAt.toInstant().atZone(zone).toLocalTime().toString();
          String endTime = schedule.endAt.toInstant().atZone(zone).toLocalTime().toString();
          tr = new ShiftTimeRange(startTime, endTime);
        }
        return new EmployeeListItem(e.id, e.displayName, e.avatarUrl, tr);
      })
      .toList();

    return new LoginContextResponse(
      new OutletDto(outlet.id, outlet.name, outlet.timezone),
      employees
    );
  }

  @Transactional
  public LoginResponse loginWithPin(LoginWithPinRequest request) {
    validateSixDigit(request.pin());

    PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> new NotFoundException("Unknown device"));

    Employee employee = employeeRepository.findByIdOptional(request.employeeId())
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    if (!employee.outletId.equals(device.outletId)) {
      throw new ForbiddenException("Employee not in outlet");
    }

    EmployeeCredential cred = credentialRepository.findByEmployeeId(employee.id)
      .orElseThrow(() -> new ForbiddenException("PIN not set"));

    if (cred.lockedUntil != null && cred.lockedUntil.toInstant().isAfter(Instant.now())) {
      throw new ForbiddenException("Employee locked");
    }

    if (!pinHasher.matches(request.pin(), cred.pinHash)) {
      credentialRepository.incrementFailedAttempts(employee.id);
      throw new ForbiddenException("Invalid PIN");
    }

    credentialRepository.resetFailedAttempts(employee.id);

    Shift shift = shiftRepository.findActive(device.outletId, employee.id)
      .orElseGet(() -> shiftRepository.createActive(device.outletId, employee.id));

    ShiftSession session = sessionRepository.create(shift.id, device.id);

    List<String> roles = roleRepository.listRoles(employee.id);
    String accessToken = jwtIssuer.issueAccessToken(employee, device.outletId, roles, session.id);
    String refreshToken = jwtIssuer.issueRefreshToken(employee, device.outletId, session.id);

    Outlet outlet = outletRepository.findByIdOptional(device.outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    return LoginResponse.from(employee, outlet, roles, shift, session, accessToken, refreshToken);
  }

  @Transactional
  public PinOtpRequestResponse requestPinOtp(PinOtpRequest request) {
    PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> new NotFoundException("Unknown device"));

    Employee employee = employeeRepository.findByEmailAndOutlet(request.email(), device.outletId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    String otp = otpService.generateOtp(PIN_LENGTH);

    PinOtpChallenge ch = new PinOtpChallenge();
    ch.id = com.foodgrid.common.util.Ids.uuid();
    ch.employeeId = employee.id;
    ch.outletId = device.outletId;
    ch.otpHash = pinHasher.hash(otp);
    ch.expiresAt = java.util.Date.from(Instant.now().plus(OTP_TTL));
    ch.createdAt = java.util.Date.from(Instant.now());
    otpRepository.persist(ch);

    otpService.sendOtpEmail(employee.email, otp);

    return new PinOtpRequestResponse("SENT", ch.id, otpService.maskEmail(employee.email));
  }

  @Transactional
  public PinOtpResendResponse resendPinOtp(PinOtpResendRequest request) {
    PinOtpChallenge ch = otpRepository.findByIdOptional(request.challengeId())
      .orElseThrow(() -> new NotFoundException("Challenge not found"));

    if (ch.consumedAt != null) {
      throw new BadRequestException("Challenge already used");
    }
    if (ch.expiresAt.toInstant().isBefore(Instant.now())) {
      throw new BadRequestException("Challenge expired");
    }

    Employee employee = employeeRepository.findByIdOptional(ch.employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    String otp = otpService.generateOtp(PIN_LENGTH);
    ch.otpHash = pinHasher.hash(otp);
    ch.resendCount = ch.resendCount + 1;
    otpRepository.persist(ch);

    otpService.sendOtpEmail(employee.email, otp);

    return new PinOtpResendResponse("SENT");
  }

  @Transactional
  public LoginResponse verifyPinOtp(PinOtpVerifyRequest request) {
    validateSixDigit(request.otp());

    PosDevice device = deviceRepository.findByDeviceCode(request.deviceId())
      .orElseThrow(() -> new NotFoundException("Unknown device"));

    PinOtpChallenge ch = otpRepository.findByIdOptional(request.challengeId())
      .orElseThrow(() -> new NotFoundException("Challenge not found"));

    if (!ch.outletId.equals(device.outletId)) {
      throw new ForbiddenException("Challenge not valid for outlet");
    }

    if (ch.consumedAt != null) {
      throw new BadRequestException("Challenge already used");
    }
    if (ch.expiresAt.toInstant().isBefore(Instant.now())) {
      throw new BadRequestException("Challenge expired");
    }

    if (!pinHasher.matches(request.otp(), ch.otpHash)) {
      throw new ForbiddenException("Invalid OTP");
    }

    ch.consumedAt = java.util.Date.from(Instant.now());
    otpRepository.persist(ch);

    Employee employee = employeeRepository.findByIdOptional(ch.employeeId)
      .orElseThrow(() -> new NotFoundException("Employee not found"));

    Shift shift = shiftRepository.findActive(device.outletId, employee.id)
      .orElseGet(() -> shiftRepository.createActive(device.outletId, employee.id));

    ShiftSession session = sessionRepository.create(shift.id, device.id);

    List<String> roles = roleRepository.listRoles(employee.id);
    String accessToken = jwtIssuer.issueAccessToken(employee, device.outletId, roles, session.id);
    String refreshToken = jwtIssuer.issueRefreshToken(employee, device.outletId, session.id);

    Outlet outlet = outletRepository.findByIdOptional(device.outletId)
      .orElseThrow(() -> new NotFoundException("Outlet not found"));

    return LoginResponse.from(employee, outlet, roles, shift, session, accessToken, refreshToken);
  }

  private static void validateSixDigit(String value) {
    if (value == null || value.length() != PIN_LENGTH || !value.chars().allMatch(Character::isDigit)) {
      throw new BadRequestException("Must be a 6-digit code");
    }
  }
}
