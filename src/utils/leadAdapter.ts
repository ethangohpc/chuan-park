/**
 * LEAD DELIVERY ADAPTER
 * ===========================================================================
 * One place to connect the contact form to wherever leads should go. Nothing
 * here reads a secret from the client bundle — all credentials come from
 * server-side environment variables (see .env.example).
 *
 * Modes (LEAD_DELIVERY_MODE):
 *   console  DEVELOPMENT ONLY. Logs the lead to the server console. Nothing is
 *            delivered anywhere. The UI says so explicitly — the form never
 *            pretends to be connected to a CRM when it is not.
 *   webhook  POSTs JSON to LEAD_WEBHOOK_URL. Works with a CRM endpoint,
 *            Zapier/Make, n8n, or a Google Apps Script Web App writing to a
 *            Google Sheet.
 *   email    Sends a transactional email. The example below uses Resend's
 *            REST API; swap the fetch call for your provider.
 *   telegram Sends a formatted message to a Telegram chat via a bot. Needs
 *            TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID. Fastest way to get a
 *            lead onto your phone with no third-party service in between.
 */

export interface LeadRecord {
  // Enquiry
  name: string;
  phone: string;
  /** What they asked for. Multi-select, so always a list. */
  interests: string[];
  /** Which sizes they are looking at. May be empty. */
  unitTypes: string[];
  message: string;

  // Consent — recorded with the submission, per PDPA good practice
  consentEnquiry: boolean;
  consentMarketing: boolean;
  consentText: string;
  marketingConsentText: string;
  consentTimestamp: string;

  // Context
  project: string;
  submittedAt: string;

  // Attribution
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  landingPage: string;
  referrer: string;
  userAgent: string;
}

export type DeliveryMode = 'console' | 'webhook' | 'email' | 'telegram';

export interface DeliveryResult {
  ok: boolean;
  /** True when the lead was only logged locally and NOT delivered. */
  simulated: boolean;
  error?: string;
}

export function deliveryMode(env: Record<string, string | undefined>): DeliveryMode {
  const raw = (env.LEAD_DELIVERY_MODE || 'console').toLowerCase();
  return raw === 'webhook' || raw === 'email' || raw === 'telegram' ? raw : 'console';
}

export async function deliverLead(
  lead: LeadRecord,
  env: Record<string, string | undefined>
): Promise<DeliveryResult> {
  const mode = deliveryMode(env);

  if (mode === 'webhook') return deliverViaWebhook(lead, env);
  if (mode === 'email') return deliverViaEmail(lead, env);
  if (mode === 'telegram') return deliverViaTelegram(lead, env);
  return deliverToConsole(lead);
}

/* -------------------------------------------------------------------------- */

function deliverToConsole(lead: LeadRecord): DeliveryResult {
  console.warn(
    '\n[LEAD — NOT DELIVERED] LEAD_DELIVERY_MODE is "console". This lead was logged only.\n' +
      'Set LEAD_DELIVERY_MODE=webhook or =email in your environment to deliver it.\n'
  );

  console.info(JSON.stringify(redactForLogs(lead), null, 2));
  return { ok: true, simulated: true };
}

async function deliverViaWebhook(
  lead: LeadRecord,
  env: Record<string, string | undefined>
): Promise<DeliveryResult> {
  const url = env.LEAD_WEBHOOK_URL;
  if (!url) {
    return {
      ok: false,
      simulated: false,
      error: 'LEAD_WEBHOOK_URL is not set but LEAD_DELIVERY_MODE is "webhook".',
    };
  }

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (env.LEAD_WEBHOOK_SECRET) headers['x-webhook-secret'] = env.LEAD_WEBHOOK_SECRET;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(lead),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, simulated: false, error: `Webhook responded ${res.status}` };
    }
    return { ok: true, simulated: false };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : 'Webhook request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* -------------------------------------------------------------------------- */

/** Telegram renders a small HTML subset; these four characters must be escaped. */
function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Sends the lead to a Telegram chat through the Bot API.
 *
 * The phone number is wrapped in a tel: link so the notification is one tap
 * from a call, and the whole message is capped at Telegram's 4096-character
 * limit — a long enquiry message is truncated rather than silently rejected.
 */
async function deliverViaTelegram(
  lead: LeadRecord,
  env: Record<string, string | undefined>
): Promise<DeliveryResult> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      ok: false,
      simulated: false,
      error: 'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must both be set.',
    };
  }

  const e = escapeTelegramHtml;
  const row = (label: string, value: string) => (value ? `${label}: ${e(value)}` : null);

  const source =
    [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ') ||
    (lead.gclid || lead.gbraid || lead.wbraid ? 'Google Ads' : '') ||
    (lead.referrer ? `referrer ${lead.referrer}` : 'direct');

  const lines = [
    `<b>New enquiry — ${e(lead.project)}</b>`,
    '',
    `<b>${e(lead.name)}</b>`,
    `📱 <a href="tel:${e(lead.phone.replace(/[^\d+]/g, ''))}">${e(lead.phone)}</a>`,
    '',
    row('Wants', lead.interests.join(', ')),
    row('Unit type', lead.unitTypes.join(', ')),
    lead.message ? `\n💬 ${e(lead.message)}` : null,
    '',
    `<i>Source: ${e(source)}</i>`,
    `<i>${e(lead.submittedAt)}</i>`,
  ].filter((line): line is string => line !== null);

  let text = lines.join('\n');
  if (text.length > 4096) text = `${text.slice(0, 4000)}\n\n<i>[truncated]</i>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Telegram explains itself in the body; surface it so a wrong chat id or
      // a revoked bot token is diagnosable from the server log.
      const detail = await res.text().catch(() => '');
      return {
        ok: false,
        simulated: false,
        error: `Telegram responded ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      };
    }
    return { ok: true, simulated: false };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : 'Telegram request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverViaEmail(
  lead: LeadRecord,
  env: Record<string, string | undefined>
): Promise<DeliveryResult> {
  const apiKey = env.LEAD_EMAIL_API_KEY;
  const to = env.LEAD_EMAIL_TO;
  const from = env.LEAD_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return {
      ok: false,
      simulated: false,
      error: 'LEAD_EMAIL_API_KEY, LEAD_EMAIL_TO and LEAD_EMAIL_FROM must all be set.',
    };
  }

  const subject = `New enquiry — ${lead.project} — ${lead.name}`;
  const body = [
    `Project: ${lead.project}`,
    `Name: ${lead.name}`,
    `Mobile: ${lead.phone}`,
    `Interested in: ${lead.interests.join(', ') || '—'}`,
    `Preferred unit type: ${lead.unitTypes.join(', ') || '—'}`,
    '',
    `Message: ${lead.message || '—'}`,
    '',
    '--- Consent ---',
    `Enquiry consent: ${lead.consentEnquiry ? 'YES' : 'NO'} at ${lead.consentTimestamp}`,
    `Marketing consent: ${lead.consentMarketing ? 'YES' : 'NO'}`,
    `Wording shown: ${lead.consentText}`,
    '',
    '--- Attribution ---',
    `Source/Medium/Campaign: ${lead.utmSource || '—'} / ${lead.utmMedium || '—'} / ${lead.utmCampaign || '—'}`,
    `Term/Content: ${lead.utmTerm || '—'} / ${lead.utmContent || '—'}`,
    `gclid: ${lead.gclid || '—'}  gbraid: ${lead.gbraid || '—'}  wbraid: ${lead.wbraid || '—'}`,
    `Landing page: ${lead.landingPage}`,
    `Referrer: ${lead.referrer || '—'}`,
    `Submitted at: ${lead.submittedAt}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      return { ok: false, simulated: false, error: `Email API responded ${res.status}` };
    }
    return { ok: true, simulated: false };
  } catch (err) {
    return {
      ok: false,
      simulated: false,
      error: err instanceof Error ? err.message : 'Email request failed',
    };
  }
}

/** Masks the contact details when writing to a shared server log. */
function redactForLogs(lead: LeadRecord): Record<string, unknown> {
  const maskedPhone = lead.phone.replace(/\d(?=\d{2})/g, '•');
  return { ...lead, phone: maskedPhone };
}
