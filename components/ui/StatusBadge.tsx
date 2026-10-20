import type { ReactNode } from 'react';
const positive = new Set(['available', 'paid', 'completed', 'succeeded', 'published', 'active']);
const negative = new Set(['rejected', 'cancelled', 'failed', 'blocked', 'banned']);
export function StatusBadge({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`tv-badge ${positive.has(status) ? 'tv-badge-positive' : negative.has(status) ? 'tv-badge-negative' : 'tv-badge-neutral'}`}>{children}</span>;
}
