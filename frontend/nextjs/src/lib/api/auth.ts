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
  // This validates the email exists and auto-registers the device
  let context: any;
  try {
    context = await getLoginContext(input.deviceId, input.email);
  } catch (err: any) {
    if (err?.message?.includes("404") || err?.message?.includes("not found")) {
      throw new Error("Employee not found. Please check your email address.");
    }
    throw err;
  }

  if (!context?.outlet?.id) {
    throw new Error("Device not configured. Please contact administrator.");
  }

  const employeeId = context.matchedEmployeeId;
  if (!employeeId) {
    throw new Error("Could not identify employee for this login.");
  }

  // Step 2: Directly try PIN login with the matched employee ID
  try {
    const loginResponse = await loginWithPin({
      employeeId: employeeId,
      pin: input.pin,
      deviceId: input.deviceId,
    });

    if (loginResponse?.accessToken) {
      return loginResponse;
    }
    throw new Error("Login failed. No access token received.");
  } catch (err: any) {
    throw new Error(err?.message || "Invalid PIN. Please try again.");
  }
}
