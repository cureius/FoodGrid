import { API_BASE } from "@/lib/api/leads";
import { DEMO_CONFIG, DemoRole } from "@/constants/demo";

const STORAGE_KEYS: Record<DemoRole, string> = {
  customer: 'fg_demo_customer_token',
  kitchen: 'fg_demo_staff_token',
  staff: 'fg_demo_staff_token',
  cashier: 'fg_demo_staff_token',
  admin: 'fg_demo_admin_token',
};

export async function fetchDemoToken(role: DemoRole): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/auth/token/${role}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch demo token", await res.text());
      return null;
    }

    const data = await res.json();
    return data.access_token;
  } catch (e) {
    console.error("Error fetching demo token", e);
    return null;
  }
}

export function setDemoToken(role: DemoRole, token: string) {
  if (typeof window === "undefined") return;
  const key = STORAGE_KEYS[role];
  localStorage.setItem(key, token);
  
  // Also set the "standard" keys if they match, effectively logging the user in
  if (role === 'admin') {
      localStorage.setItem('fg_admin_access_token', token);
  } else if (role === 'customer') {
      localStorage.setItem('fg_customer_token', token);
  } else {
      localStorage.setItem('fg_access_token', token);
  }
}

export function getDemoToken(role: DemoRole): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS[role]);
}

export function clearDemoTokens() {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}
