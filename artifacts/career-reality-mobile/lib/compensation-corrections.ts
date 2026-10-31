export type CompensationCorrections = Record<string, string>;

export const COMPENSATION_CORRECTIONS_STORAGE_KEY =
  '@careerreality/compensation-corrections';

export function parseCompensationCorrections(
  serialized: string | null,
): CompensationCorrections {
  if (!serialized) return {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) => typeof key === 'string' && typeof value === 'string',
      ),
    );
  } catch {
    return {};
  }
}

export function updateCompensationCorrection(
  previous: CompensationCorrections,
  key: string,
  value: string,
): CompensationCorrections {
  const next = { ...previous };
  if (value.trim()) next[key] = value;
  else delete next[key];
  return next;
}

export function clearCompensationCorrections(
  previous: CompensationCorrections,
  prefix?: string,
): CompensationCorrections {
  if (!prefix) return {};
  return Object.fromEntries(
    Object.entries(previous).filter(([key]) => !key.startsWith(prefix)),
  );
}

export function shouldConfirmCompensationReset(correctionCount: number): boolean {
  return correctionCount > 1;
}

export function countCompensationCorrections(
  corrections: CompensationCorrections,
  prefix: string,
): number {
  return Object.keys(corrections).filter((key) => key.startsWith(prefix)).length;
}

export function correctedValue(
  originalValue: string,
  corrections: CompensationCorrections,
  key: string,
): string {
  return corrections[key] ?? originalValue;
}