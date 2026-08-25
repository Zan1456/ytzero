/** A YouTube Short can be at most three minutes long. */
export const SHORT_MAX_DURATION_SECONDS = 3 * 60;

/** Parse the clock-style durations stored in the video catalog. */
export function parseVideoDurationSeconds(duration: string | null | undefined): number | null {
  if (!duration) return null;
  const parts = duration.trim().split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;
  const values = parts.map(Number);
  if (values.some((value) => !Number.isSafeInteger(value))) return null;
  return values.reduce((seconds, value) => seconds * 60 + value, 0);
}

/**
 * Resolve only facts that are safe without contacting YouTube. A short
 * duration alone is not enough: ordinary videos can also be short.
 */
export function inferIsShortFromMetadata(title: string, duration?: string | null): boolean | null {
  const seconds = parseVideoDurationSeconds(duration);
  if (seconds !== null && seconds > SHORT_MAX_DURATION_SECONDS) return false;
  if (/#shorts?\b/i.test(title)) return true;
  return null;
}

/** Exponential retry schedule, capped at one request per day. */
export function shortCheckRetryMinutes(attempts: number): number {
  const normalizedAttempts = Math.max(1, Math.floor(attempts));
  return Math.min(24 * 60, 30 * 2 ** (normalizedAttempts - 1));
}

export function shortCheckRetryInterval(attempts: number): string {
  return `+${shortCheckRetryMinutes(attempts)} minutes`;
}
