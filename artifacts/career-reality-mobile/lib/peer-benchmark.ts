import { findRelocationCity } from './relocation';

export const MIN_ANONYMOUS_PEERS = 10;

export const peerBenchmarkRoles = [
  'Software engineer',
  'Data scientist',
  'DevOps / SRE',
  'Product manager',
  'Data analyst',
  'UX designer',
] as const;

export type PeerBenchmarkRole = (typeof peerBenchmarkRoles)[number];

export function experienceBandFor(value: string): string {
  const years = Number(value.match(/\d+(?:\.\d+)?/)?.[0] ?? 0);
  if (years <= 2) return '0–2 years';
  if (years <= 5) return '3–5 years';
  if (years <= 8) return '5–8 years';
  return '9+ years';
}

export function defaultPeerRole(value: string): PeerBenchmarkRole {
  const normalized = value.toLowerCase();
  if (normalized.includes('data scientist')) return 'Data scientist';
  if (normalized.includes('devops') || normalized.includes('sre') || normalized.includes('platform')) return 'DevOps / SRE';
  if (normalized.includes('product')) return 'Product manager';
  if (normalized.includes('analyst')) return 'Data analyst';
  if (normalized.includes('design')) return 'UX designer';
  return 'Software engineer';
}

export function isPrivacySafe(sampleSize: number | undefined): boolean {
  return typeof sampleSize === 'number' && sampleSize >= MIN_ANONYMOUS_PEERS;
}

export function benchmarkScopeLabel(role: string, city: string, experience: string): string {
  return `${role} · ${city} · ${experience}`;
}

export function cityForBenchmark(value: string) {
  return findRelocationCity(value)?.name ?? (value.trim() || 'your city');
}