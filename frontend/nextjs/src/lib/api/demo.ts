const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080';

export interface DemoTokenResponse {
  accessToken: string;
  role: string;
  outletId: string;
  displayName: string;
  employeeId: string | null;
  sessionId: string | null;
}

export async function fetchDemoToken(role: 'staff' | 'admin' | 'customer'): Promise<DemoTokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/demo/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`Failed to fetch demo token for ${role}`);
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/demo/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to reset demo data');
}
