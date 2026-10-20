export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/account';
  try {
    const parsed = new URL(value, 'https://ticketverse.local');
    if (parsed.origin !== 'https://ticketverse.local' || /^\/(login|register)(\/|$)/.test(parsed.pathname)) return '/account';
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return '/account';
  }
}
