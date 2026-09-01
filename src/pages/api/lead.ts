/**
 * POST /api/lead — contact form endpoint
 * ===========================================================================
 * Runs server-side (never prerendered). Responsibilities, in order:
 *   1. Rate limit by IP.
 *   2. Honeypot + minimum fill-time checks.
 *   3. Full server-side validation (the client pass is convenience only).
 *   4. Record consent state, wording and timestamp.
 *   5. Deliver via the configured adapter.
 *   6. Respond — JSON for fetch, a 303 redirect to /thank-you for a plain
 *      form POST, and a readable 400 page when something needs fixing.
 *
 * It never reports success for a submission that was not delivered, except in
 * explicit `console` development mode, which the UI labels as such.
 *
 * No secret is ever sent to the browser: everything comes from server-side
 * environment variables.
 */
import type { APIRoute } from 'astro';
import { validateLead, hasErrors, normalisePhone, FIELD_LABELS } from '../../utils/validation';
import type { FieldErrors } from '../../utils/validation';
import { deliverLead, deliveryMode, type LeadRecord } from '../../utils/leadAdapter';
import { hit, clientKey } from '../../utils/rateLimit';
import { project, verified } from '../../data/project';
import { site } from '../../data/site';
import { agent } from '../../data/agent';

export const prerender = false;

const CONSENT_TEXT = `By submitting this enquiry, I confirm that I have read the Privacy Policy and consent to Ethan Goh of ${agent.agencyName} contacting me regarding this property enquiry by WhatsApp, phone or email.`;
const MARKETING_TEXT =
  'I would also like to receive information about other Singapore property launches and relevant property market updates. I understand that I may withdraw my consent.';

function wantsJson(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('application/json');
}

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

/** Every checked box for a name — checkbox groups post one entry per tick. */
function list(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Asks Cloudflare whether a Turnstile token is genuine.
 *
 * Fails CLOSED: a network error or a non-OK response counts as "not verified".
 * The alternative — letting submissions through whenever Cloudflare is
 * unreachable — is a hole a bot can open on demand.
 *
 * The token is single-use; Cloudflare rejects a replay, which is why the
 * client must fetch a fresh one after every failed submit.
 */
async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip && ip !== 'unknown') body.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** Minimal, readable HTML fallback for the no-JavaScript error path. */
function errorPage(errors: FieldErrors, status: number): Response {
  const items = Object.entries(errors)
    .map(([field, message]) => {
      const label = FIELD_LABELS[field] ?? field;
      return `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(message ?? '')}</li>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en-SG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Your enquiry needs a small correction</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; background:#fbfaf7; color:#3b3934;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height:1.65; }
  main { max-width: 40rem; margin: 0 auto; padding: 4rem 1.5rem; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-weight:400; color:#1b1a18;
    font-size: clamp(1.7rem, 1.4rem + 1.3vw, 2.4rem); line-height:1.15; margin:0 0 1rem; }
  ul { padding-left: 1.1rem; margin: 0 0 1.5rem; }
  li { margin-bottom: .5rem; }
  a.button { display:inline-block; padding:.85em 1.6em; background:#1b1a18; color:#f4f1ea;
    text-decoration:none; border-radius:3px; font-size:.9rem; letter-spacing:.04em;
    text-transform:uppercase; }
  p.note { font-size:.9rem; color:#63605a; margin-top:2rem; }
</style>
</head>
<body>
<main>
  <h1>Your enquiry needs a small correction</h1>
  <p>Your enquiry was <strong>not</strong> sent. Please go back and adjust the following:</p>
  <ul>${items}</ul>
  <p><a class="button" href="/#contact">Back to the form</a></p>
  <p class="note">Nothing you entered has been stored. If it is easier, call or WhatsApp
  ${escapeHtml(agent.mobileDisplay)} instead.</p>
</main>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Reads configuration at request time, from every place it can legitimately
 * come from, in increasing order of authority:
 *
 *   1. `import.meta.env`   — inlined at build time, so it only carries what
 *      existed when the build ran.
 *   2. `process.env`       — populated by `astro dev` and by Node hosts.
 *   3. `cloudflare:workers` — bindings and secrets on Cloudflare Workers. This
 *      is the authoritative source in production, and the only one that sees a
 *      secret added after the last build.
 *
 * The Cloudflare module is imported dynamically through a variable specifier so
 * Vite cannot resolve it at build time: it does not exist off-Workers, and a
 * static import would break `astro dev`. (`Astro.locals.runtime.env` used to
 * serve this purpose and was removed in Astro 7.)
 */
type EnvBag = Record<string, string | undefined>;

async function readEnv(): Promise<EnvBag> {
  const buildTime = import.meta.env as unknown as EnvBag;

  const processEnv =
    typeof globalThis.process !== 'undefined' && globalThis.process.env
      ? (globalThis.process.env as EnvBag)
      : {};

  let workersEnv: EnvBag = {};
  try {
    const specifier = 'cloudflare:workers';
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: EnvBag };
    workersEnv = mod.env ?? {};
  } catch {
    /* Not running on Workers — the two sources above are the whole story. */
  }

  return { ...buildTime, ...processEnv, ...workersEnv };
}

export const POST: APIRoute = async ({ request }) => {
  const env = await readEnv();
  const json = wantsJson(request);

  // ---- 1. Rate limiting ---------------------------------------------------
  // Default 10 per window. Singapore mobile networks and offices put many
  // genuine visitors behind one address, so a very low cap blocks real leads.
  const max = Number(env.LEAD_RATE_LIMIT_MAX ?? '10');
  const windowSeconds = Number(env.LEAD_RATE_LIMIT_WINDOW_SECONDS ?? '600');
  const limit = hit(clientKey(request), Number.isFinite(max) ? max : 10, windowSeconds);

  if (!limit.allowed) {
    const message =
      'Too many submissions from this connection. Please wait a few minutes and try again, or contact us directly by phone or WhatsApp.';
    if (json) {
      return new Response(JSON.stringify({ ok: false, message }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(limit.retryAfterSeconds),
        },
      });
    }
    return errorPage({ form: message }, 429);
  }

  // ---- 2. Parse -----------------------------------------------------------
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    const message = 'The submission could not be read. Please try again.';
    return json
      ? new Response(JSON.stringify({ ok: false, message }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      : errorPage({ form: message }, 400);
  }

  // ---- 3. Spam heuristics -------------------------------------------------
  // Honeypot: a real person never fills this in. Respond as if accepted so a
  // bot gets no signal, but deliver nothing.
  if (str(form, 'company')) {
    return json
      ? new Response(JSON.stringify({ ok: true, redirect: '/thank-you' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      : new Response(null, { status: 303, headers: { location: '/thank-you' } });
  }

  // Kept deliberately low. Scripted submissions post in well under a second,
  // while even a visitor using browser autofill has to tap the consent box and
  // then submit. Set it too high and you reject real, fast buyers — and a lead
  // lost to an anti-spam heuristic costs far more than a spam message.
  const minFill = Number(env.LEAD_MIN_FILL_SECONDS ?? '1.5') * 1000;
  const renderedAt = Number(str(form, 'renderedAt'));
  /* How long the form was open, when the browser told us. Reported on the
     notification so a suspiciously fast lead is visible rather than merely
     rejected — null when the field never arrived, e.g. scripting disabled. */
  const fillSeconds =
    Number.isFinite(renderedAt) && renderedAt > 0
      ? Math.max(0, Math.round((Date.now() - renderedAt) / 1000))
      : null;
  if (Number.isFinite(renderedAt) && renderedAt > 0 && Date.now() - renderedAt < minFill) {
    const message =
      'That was submitted unusually quickly, which we screen for automatically. Please press submit once more and it will go through.';
    return json
      ? new Response(JSON.stringify({ ok: false, errors: { form: message } }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      : errorPage({ form: message }, 400);
  }

  // ---- 3b. Cloudflare Turnstile ------------------------------------------
  // Only enforced when TURNSTILE_SECRET_KEY is set, so the form behaves exactly
  // as before until you deliberately switch it on. Note the trade-off: Turnstile
  // needs JavaScript, so once this is enabled a no-JS submission has no token
  // and is refused. Everything else on this page still works without scripting.
  /*
   * Enforced only when a widget is actually on the page. The two halves used to
   * be independent, which meant a secret set without a site key silently
   * refused every enquiry on the site — no widget renders, so no token can ever
   * exist. Pairing them here makes that state unreachable: clearing
   * `site.turnstileSiteKey` disables the check in the same deploy that removes
   * the widget, with no secret to remember to delete.
   */
  const turnstileSecret = site.turnstileSiteKey ? env.TURNSTILE_SECRET_KEY : undefined;
  /* null means Turnstile is not configured at all, which the notification says
     plainly rather than implying a check that never ran. */
  let turnstilePassed: boolean | null = null;
  if (turnstileSecret) {
    const token = str(form, 'cf-turnstile-response');
    const passed = token
      ? await verifyTurnstile(token, turnstileSecret, clientKey(request))
      : false;
    turnstilePassed = passed;
    if (!passed) {
      const message =
        'The anti-spam check did not complete. Please reload the page and try again, or WhatsApp instead.';
      return json
        ? new Response(JSON.stringify({ ok: false, errors: { form: message } }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          })
        : errorPage({ form: message }, 400);
    }
  }

  // ---- 4. Validation ------------------------------------------------------
  const input = {
    name: str(form, 'name'),
    phone: str(form, 'phone'),
    interests: list(form, 'interests'),
    unitTypes: list(form, 'unitTypes'),
    message: str(form, 'message'),
    consentEnquiry: form.get('consentEnquiry') === 'yes',
    consentMarketing: form.get('consentMarketing') === 'yes',
    company: '',
    renderedAt: str(form, 'renderedAt'),
  };

  const errors = validateLead(input);
  if (hasErrors(errors)) {
    return json
      ? new Response(JSON.stringify({ ok: false, errors }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      : errorPage(errors, 400);
  }

  // ---- 5. Build the record ------------------------------------------------
  const now = new Date().toISOString();

  const lead: LeadRecord = {
    name: input.name,
    phone: normalisePhone(input.phone) ?? input.phone,
    interests: input.interests,
    unitTypes: input.unitTypes,
    message: input.message,

    consentEnquiry: input.consentEnquiry,
    consentMarketing: input.consentMarketing,
    consentText: CONSENT_TEXT,
    marketingConsentText: MARKETING_TEXT,
    consentTimestamp: now,

    project: verified(project.name) ?? '[PROJECT NAME]',
    submittedAt: now,

    utmSource: str(form, 'utm_source'),
    utmMedium: str(form, 'utm_medium'),
    utmCampaign: str(form, 'utm_campaign'),
    utmTerm: str(form, 'utm_term'),
    utmContent: str(form, 'utm_content'),
    gclid: str(form, 'gclid'),
    gbraid: str(form, 'gbraid'),
    wbraid: str(form, 'wbraid'),
    landingPage: str(form, 'landingPage') || request.headers.get('referer') || '',
    referrer: str(form, 'referrer') || request.headers.get('referer') || '',
    userAgent: request.headers.get('user-agent') || '',

    /* Only reachable once every check above has passed, so these record what
       happened rather than asserting an outcome. */
    botCheck: { turnstilePassed, fillSeconds },
  };

  // ---- 6. Deliver ---------------------------------------------------------
  const result = await deliverLead(lead, env);

  if (!result.ok) {
    console.error('[LEAD DELIVERY FAILED]', result.error);
    const message =
      'Your enquiry could not be delivered just now. Please try again in a moment, or contact us by phone or WhatsApp so nothing is missed.';
    return json
      ? new Response(JSON.stringify({ ok: false, message }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        })
      : errorPage({ form: message }, 502);
  }

  if (result.simulated && deliveryMode(env) === 'console') {
    console.warn(
      '[LEAD] Accepted in development mode. Nothing was delivered. Set LEAD_DELIVERY_MODE=webhook or =email.'
    );
  }

  return json
    ? new Response(
        JSON.stringify({ ok: true, redirect: '/thank-you', simulated: result.simulated }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    : new Response(null, { status: 303, headers: { location: '/thank-you' } });
};

/** A GET here is almost always a mistake — send people to the form. */
export const GET: APIRoute = () =>
  new Response(null, { status: 303, headers: { location: '/#contact' } });
