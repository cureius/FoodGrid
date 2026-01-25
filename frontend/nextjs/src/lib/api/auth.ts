const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export function getLoginContext(deviceId: string, email: string) {
  return http<any>(`/api/v1/auth/login-context?deviceId=${encodeURIComponent(deviceId)}&email=${encodeURIComponent(email)}`);
}

export function loginWithPin(input: { employeeId: string; pin: string; deviceId: string }) {
  return http<any>(`/api/v1/auth/login/pin`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function requestPinOtp(input: { email: string; deviceId: string }) {
  return http<any>(`/api/v1/auth/pin-otp/request`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function resendPinOtp(input: { challengeId: string }) {
  return http<any>(`/api/v1/auth/pin-otp/resend`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function verifyPinOtp(input: { challengeId: string; otp: string; deviceId: string }) {
  return http<any>(`/api/v1/auth/pin-otp/verify`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

/**
 * Login with email and PIN
 * This function:
 * 1. Gets login context to validate device and get outlet (device may be auto-registered)
 * 2. Validates email exists using requestPinOtp (which finds employee by email)
 * 3. Gets employee list from login context
 * 4. Tries PIN login for each employee until finding a match
 * 
 * Note: If device doesn't exist, it will fail. Device must be pre-registered by admin
 * or the backend must support device auto-registration with outletId.
 */
export async function loginWithEmail(input: { email: string; pin: string; deviceId: string }) {
  // Step 1: Try to get login context
  // This will fail if device doesn't exist and outletId is not provided
  let context: any;
  try {
    context = await getLoginContext(input.deviceId, input.email);
  } catch (err: any) {
    // Device doesn't exist - need outletId to auto-register
    // For now, throw a helpful error
    if (err?.message?.includes("404") || err?.message?.includes("not found") || err?.message?.includes("Unknown device")) {
      throw new Error("Device not registered. Please contact administrator to register this device first.");
    }
    throw err;
  }

  if (!context?.outlet?.id) {
    throw new Error("Device not configured. Please contact administrator.");
  }

  // Step 2: Validate email exists for this outlet using requestPinOtp
  // This will throw if email doesn't exist or device doesn't exist
  let challengeId: string | null = null;
  try {
    const otpResponse = await requestPinOtp({
      email: input.email.trim(),
      deviceId: input.deviceId,
    });
    challengeId = otpResponse?.challengeId || null;
  } catch (err: any) {
    // Check if it's a device not found error
    if (err?.message?.includes("404") || err?.message?.includes("not found") || err?.message?.includes("Unknown device")) {
      throw new Error("Device not registered. Please contact administrator to register this device first.");
    }
    throw new Error(err?.message || "Invalid email or employee not found for this device");
  }

  // Step 3: Get employee list and try PIN login for each
  // Since we can't get employeeId directly from email, we try PIN login for all employees
  if (!context?.employees || context.employees.length === 0) {
    throw new Error("No employees found for this device. Please contact administrator.");
  }

  let lastError: any = null;
  for (const employee of context.employees) {
    try {
      const loginResponse = await loginWithPin({
        employeeId: employee.id,
        pin: input.pin,
        deviceId: input.deviceId,
      });

      if (loginResponse?.accessToken) {
        return loginResponse;
      }
    } catch (pinErr: any) {
      // Continue trying other employees
      lastError = pinErr;
      continue;
    }
  }

  // If we get here, PIN didn't match any employee
  throw new Error(lastError?.message || "Invalid PIN. Please try again.");
}
