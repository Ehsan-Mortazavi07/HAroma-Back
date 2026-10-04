export function parsePage(value: unknown, fallback = 1): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(100_000, Math.max(1, Math.floor(parsed)))
    : fallback;
}

export function parsePageSize(value: unknown, fallback = 20, maximum = 100): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(1, Math.floor(parsed)))
    : fallback;
}
