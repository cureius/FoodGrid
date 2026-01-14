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

export function getLoginContext(deviceId: string) {
  return http<any>(`/api/v1/auth/login-context?deviceId=${encodeURIComponent(deviceId)}`);
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
