/**
 * TRACKING EVENT CONTRACT
 * ===========================================================================
 * Every conversion-relevant interaction pushes a named event to
 * `window.dataLayer`. Components opt in declaratively:
 *
 *     <a href="..." data-track="click_whatsapp" data-track-location="hero">
 *
 * A single delegated listener (see components/Analytics.astro) reads the
 * attributes and pushes the event. This keeps the JavaScript footprint to a
 * few hundred bytes and means the page works with tags absent or blocked.
 *
 * PRIVACY
 * - No name, email, phone number or message text is ever pushed to the data
 *   layer or placed in a URL. Only the event name and coarse context.
 * - Nothing fires before consent for the relevant storage purpose is granted;
 *   Consent Mode gates the tags themselves (see components/Analytics.astro).
 *
 * ADMIN NOTES — wiring these up in GTM
 * 1. Create a Custom Event trigger for each event name below.
 * 2. For Google Ads: attach a Conversion Tracking tag to `generate_lead`
 *    (primary) and, if you want secondary signals, to `book_showflat`,
 *    `request_price_list` and `click_whatsapp`. Use the conversion ID and
 *    label from src/data/site.ts.
 * 3. Do NOT enable Enhanced Conversions until you have (a) a lawful basis and
 *    consent for it, (b) the customer-data terms accepted in Google Ads, and
 *    (c) hashing configured server-side. It is deliberately not implemented.
 */

export const TRACKING_EVENTS = [
  'view_project',
  'click_whatsapp',
  'click_call',
  'book_showflat',
  'request_price_list',
  'request_floorplans',
  'view_brochure',
  'request_brochure',
  'download_brochure',
  'view_gallery',
  'form_start',
  'form_error',
  'form_submit',
  'generate_lead',
] as const;

export type TrackingEvent = (typeof TRACKING_EVENTS)[number];

export interface TrackingPayload {
  /** Coarse placement, e.g. 'hero' | 'price' | 'mobile_bar'. Never PII. */
  location?: string;
  /** Optional non-identifying detail, e.g. a unit type id. */
  detail?: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    trackEvent?: (event: TrackingEvent, payload?: TrackingPayload) => void;
  }
}

/**
 * Server-safe helper for use inside client scripts. Safe to call when no tag
 * manager is installed: the array is created and simply never read.
 */
export function pushEvent(event: TrackingEvent, payload: TrackingPayload = {}): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    event_location: payload.location ?? 'unspecified',
    event_detail: payload.detail ?? undefined,
  });
}
