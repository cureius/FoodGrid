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
 * Check if user has a specific role in the token
 * Roles are stored in the 'groups' claim of the JWT
 */
export function hasRole(token: string, role: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  
  // Roles are stored in 'groups' claim as an array
  const groups = decoded.groups || [];
  return Array.isArray(groups) && groups.includes(role);
}

/**
 * Check if user is a tenant admin (super admin)
 * Tenant admins have the 'TENANT_ADMIN' role
 */
export function isTenantAdminToken(token: string): boolean {
  return hasRole(token, 'TENANT_ADMIN');
}

/**
 * Check if user is a client admin
 * Client admins have the 'CLIENT_ADMIN' role OR 'ADMIN' role (legacy support)
 */
export function isClientAdminToken(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  
  // Check for CLIENT_ADMIN role
  if (hasRole(token, 'CLIENT_ADMIN')) return true;
  
  // Check for ADMIN role (legacy support - existing admin users)
  // But NOT if they have TENANT_ADMIN role (to prevent tenant admins from accessing client admin)
  if (hasRole(token, 'ADMIN') && !hasRole(token, 'TENANT_ADMIN')) return true;
  
  return false;
}

/**
 * Get admin role from token
 * - TENANT_ADMIN: Super admin who manages tenants/clients (has TENANT_ADMIN role)
 * - CLIENT_ADMIN: Client admin who manages outlets and employees (has CLIENT_ADMIN or ADMIN role)
 */
export function getAdminRoleFromToken(token: string): AdminRole | null {
  if (isTenantAdminToken(token)) return 'TENANT_ADMIN';
  if (isClientAdminToken(token)) return 'CLIENT_ADMIN';
  return null;
}

/**
 * Get admin role from stored token
 */
export function getAdminRole(): AdminRole | null {
  if (typeof window === 'undefined') return null;
  
  // Check tenant admin token first
  const tenantToken = localStorage.getItem('fg_tenant_admin_access_token');
  if (tenantToken && isTenantAdminToken(tenantToken)) {
    return 'TENANT_ADMIN';
  }
  
  // Check client admin token
  const clientToken = localStorage.getItem('fg_client_admin_access_token');
  if (clientToken && isClientAdminToken(clientToken)) {
    return 'CLIENT_ADMIN';
  }
  
  // Legacy: check old admin token
  const adminToken = localStorage.getItem('fg_admin_access_token');
  if (adminToken) {
    return getAdminRoleFromToken(adminToken);
  }
  
  return null;
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

/**
 * Check if current user has ADMIN role (for accessing admin-only endpoints)
 * ADMIN role can be in tenant admin token or admin token
 */
export function hasAdminRole(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check tenant admin token
  const tenantToken = localStorage.getItem('fg_tenant_admin_access_token');
  if (tenantToken && hasRole(tenantToken, 'ADMIN')) {
    return true;
  }
  
  // Check admin token
  const adminToken = localStorage.getItem('fg_admin_access_token');
  if (adminToken && hasRole(adminToken, 'ADMIN')) {
    return true;
  }
  
  return false;
}
