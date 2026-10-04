export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeSearchQuery(value?: string, maxLength = 100): string | undefined {
  const normalized = value?.trim().slice(0, maxLength);
  return normalized ? escapeRegex(normalized) : undefined;
}
