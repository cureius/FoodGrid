/**
 * Utility functions for admin role management
 */

export type AdminRole = 'TENANT_ADMIN' | 'CLIENT_ADMIN';

/**
 * Decode JWT token
 */
export function decodeJWT(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Get admin role from token
 * - TENANT_ADMIN: Super admin who manages tenants/clients (no outletId in token)
 * - CLIENT_ADMIN: Client admin who manages outlets and employees (has outletId in token)
 */
export function getAdminRole(): AdminRole | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('fg_admin_access_token');
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded) return null;

  // If no outletId, it's a tenant admin (super admin)
  // If outletId exists, it's a client admin
  return decoded.outletId ? 'CLIENT_ADMIN' : 'TENANT_ADMIN';
}

/**
 * Check if current user is tenant admin
 */
export function isTenantAdmin(): boolean {
  return getAdminRole() === 'TENANT_ADMIN';
}

/**
 * Check if current user is client admin
 */
export function isClientAdmin(): boolean {
  return getAdminRole() === 'CLIENT_ADMIN';
}
