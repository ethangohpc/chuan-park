/**
 * Small formatting helpers shared by components.
 */

import { isPlaceholder } from '../data/project';

/**
 * Renders a value, or a clearly-labelled fallback when it is still an
 * unfilled placeholder. Never silently prints `[SOMETHING]` as if it were a
 * real value in visitor-facing prose.
 */
export function display(value: string | undefined, fallback = 'To be confirmed'): string {
  return isPlaceholder(value) ? fallback : (value as string);
}

/** Formats an ISO date (YYYY-MM-DD) as e.g. "10 August 2026". */
export function formatDate(value: string | undefined): string | null {
  if (isPlaceholder(value)) return null;
  const parsed = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return value as string;
  return new Intl.DateTimeFormat('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  }).format(parsed);
}

/** ISO date for <time datetime="..."> — returns null when not a real date. */
export function isoDate(value: string | undefined): string | null {
  if (isPlaceholder(value)) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value as string) ? (value as string) : null;
}

/**
 * Replaces `[PROJECT NAME]` and friends inside a copy string with the
 * configured values, so FAQ answers and WhatsApp messages stay in sync.
 */
export function interpolate(
  text: string,
  replacements: Record<string, string | undefined>
): string {
  let out = text;
  for (const [token, value] of Object.entries(replacements)) {
    if (value === undefined) continue;
    out = out.split(`[${token}]`).join(value);
  }
  return out;
}

/** Title-cases a slug-ish string for display. */
export function humanise(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
