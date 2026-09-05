/**
 * Robust numeric and percentage formatters to guard against NaN, null, and undefined values.
 */

export function safeNumber(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === 'number' ? val : Number(val);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

export function safeRound(val: unknown, fallback: number = 0): number {
  return Math.round(safeNumber(val, fallback));
}

export function formatPct(val: unknown, fallback: number = 0): string {
  const num = safeNumber(val, fallback);
  return `${Math.round(num)}%`;
}

export function formatNumber(val: unknown, fallback: number = 0): string {
  const num = safeNumber(val, fallback);
  return num.toLocaleString();
}

export function formatScore(val: unknown, fallback: number = 75.0): string {
  const num = safeNumber(val, fallback);
  return num.toFixed(1);
}
