interface BlockedPattern {
  method: string;
  pattern: RegExp;
  message: string;
}

const BLOCKED_PATTERNS: BlockedPattern[] = [
  { method: 'DELETE', pattern: /\/api\/v1\//, message: 'Delete operations are disabled in demo mode' },
  { method: 'POST', pattern: /\/api\/v1\/payments\/initiate/, message: 'Payment gateway is disabled in demo mode' },
  { method: 'POST', pattern: /\/api\/v1\/payments\/refund/, message: 'Refunds are disabled in demo mode' },
  { method: 'PUT', pattern: /\/api\/v1\/admin\/outlets\/[^/]+$/, message: 'Outlet configuration is disabled in demo mode' },
  { method: 'POST', pattern: /\/api\/v1\/outlets\/.*\/integrations/, message: 'Integrations are disabled in demo mode' },
];

export function checkDemoBlocked(method: string, url: string): string | null {
  const upperMethod = method.toUpperCase();
  for (const bp of BLOCKED_PATTERNS) {
    if (bp.method === upperMethod && bp.pattern.test(url)) {
      return bp.message;
    }
  }
  return null;
}

const DISABLED_ACTIONS = new Set([
  'delete-order',
  'delete-employee',
  'delete-outlet',
  'payment-gateway',
  'export-data',
  'integration-config',
]);

export function isDemoActionDisabled(action: string): boolean {
  return DISABLED_ACTIONS.has(action);
}
