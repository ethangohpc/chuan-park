# Chuan Park — Landing Page

A production landing page for **Chuan Park**, Lorong Chuan, District 19, built for Google Ads traffic on the Singapore new-launch template. Astro + TypeScript, server-rendered HTML, minimal client JavaScript, deployed to Cloudflare Workers.

Operated by **Ethan Goh**, CEA-registered salesperson with **Huttons Asia Pte Ltd**. This is an _independent marketing website_ — it is not, and must not be presented as, the developer's official site.

## Where the content comes from

Everything on the page is traceable to one of four documents, all of which sit
at the repository root or are named in `src/data/project.ts`:

| Ref | Document                                                      | Dated       | Supplies                                                       |
| --- | ------------------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| A   | `Huttons_Chuan_Park_Sales_Kit_compressed.pdf`                 | 28 Oct 2024 | fact sheet, unit mix, site plan, orientation splits, renders   |
| B   | `Chuan Park Preview Catalogue (English).pdf`                  | 2 Oct 2024  | layout sheets, location map, developer profile, brochure cover |
| C   | `Chuan-Park-R064895H-20260822.pdf`                            | 22 Aug 2026 | current "from" prices                                          |
| D   | Huttons agent portal unit chart (screenshot at the repo root) | 22 Aug 2026 | sold / available split by type                                 |

A and B are two years old, so **nothing time-sensitive is taken from them** —
price and availability come from C and D and carry those dates on the page.
Anything none of the four states is left as a `[PLACEHOLDER]`, which the UI
hides rather than printing.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Commands](#2-commands)
3. [Editing the project](#3-editing-the-project)
4. [Editing the agent details](#4-editing-the-agent-details)
5. [Adding images](#5-adding-images)
6. [Adding the brochure and price list](#6-adding-the-brochure-and-price-list)
7. [Switching the visual theme](#7-switching-the-visual-theme)
8. [Connecting the contact form](#8-connecting-the-contact-form)
9. [Tracking, consent and Google Ads](#9-tracking-consent-and-google-ads)
10. [Deploying to Cloudflare Workers](#10-deploying-to-cloudflare-workers)
11. [Duplicating for the next launch](#11-duplicating-for-the-next-launch)
12. [Pre-publication checklist](#12-pre-publication-checklist)
13. [Project structure](#13-project-structure)
14. [Performance and accessibility notes](#14-performance-and-accessibility-notes)
15. [What this template deliberately will not do](#15-what-this-template-deliberately-will-not-do)

---

## 1. Quick start

Requires **Node.js 20.3 or newer**. Check with `node -v`; if the command is not found, install Node from [nodejs.org](https://nodejs.org) or via `brew install node`.

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:4321>.

The first `npm run dev` prints a **pre-publication check** listing every fact not yet verified and every agent detail still holding a placeholder. That warning is expected on a fresh clone — work through it before going live.

---

## 2. Commands

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload at `localhost:4321`    |
| `npm run build`        | Production build into `dist/client` and `dist/server`     |
| `npm run preview`      | Runs the built Worker locally via `wrangler dev`          |
| `npm run typecheck`    | `astro check` — TypeScript and template diagnostics       |
| `npm run lint`         | ESLint over `.ts`, `.js` and `.astro`                     |
| `npm run format`       | Prettier, writing changes                                 |
| `npm run format:check` | Prettier in check-only mode (for CI)                      |
| `npm test`             | Playwright functional suite — own dev server on port 4331 |
| `npm run a11y`         | axe-core WCAG 2.1 AA audit, every page, both viewports    |
| `npm run test:all`     | Both Playwright suites together                           |
| `npm run test:ui`      | Playwright in interactive UI mode                         |
| `npm run linkcheck`    | linkinator broken-link crawl against a running dev server |
| `npm run verify`       | Typecheck followed by a production build                  |

First run of the tests also needs the browser:

```bash
npx playwright install chromium
```

**`npm run preview` needs a build first.** `astro preview` cannot serve this project: the Cloudflare adapter compiles `/api/lead` into a Worker and Astro's preview server has no way to run it. Run `npm run build && npm run preview` to exercise the real runtime, or just `npm run dev` — the only route that behaves differently is the form endpoint.

`npm run linkcheck` expects `npm run dev` to be running in another terminal. Its config skips the `example.com` placeholder domain and the sitemap (which only exists after a build); once you set a real domain, links to it are checked normally.

**Astro 7 dev-server notes.** `astro dev` writes a lock file and may run in the background. If a server gets stuck, clear it with `npx astro dev stop` — killing the process with `kill` or `pkill` leaves the lock behind and the next start will refuse to run. `astro dev status` and `astro dev logs` are also available.

---

## 3. Editing the project

**Everything about the development lives in one file: `src/data/project.ts`.** No project fact is hard-coded in any component.

Sections of that file:

| Block          | Covers                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| General        | Name, slug, type, district, address, tenure, developer, architect, contractor, unit/block/storey counts, land size, TOP, status, preview and booking dates, showflat address, last-updated date, coordinates |
| `pricing`      | Starting price, PSF range, per-unit-type table, maintenance estimate, price-list document, price last-updated date                                                                                           |
| `unitTypes`    | Unit mix: bedrooms, study/flex, areas, counts, availability, buyer profile, selection notes                                                                                                                  |
| `floorplans`   | Individual plans with images, categories, areas, availability                                                                                                                                                |
| `brochure`     | File, cover, format, size, last-updated date, one-sentence summary                                                                                                                                           |
| `location`     | Map, overview, strengths, trade-offs, amenity groups (MRT, expressways, schools, shopping, dining, parks, healthcare), future infrastructure                                                                 |
| `media`        | Logo, hero (desktop + mobile), site plan, OG image, developer logo, gallery                                                                                                                                  |
| `content`      | Hero copy, overview, buyer considerations, pricing analysis, unit-selection analysis, market comparison, developer profile, past developments                                                                |
| `faq`          | Questions and answers, with a per-item flag for structured data                                                                                                                                              |
| `contact`      | WhatsApp message templates, response expectation                                                                                                                                                             |
| `verification` | The pre-publication checklist                                                                                                                                                                                |

### The placeholder rule

Any value left as `[SOMETHING]` is treated as _unverified_. The page does not print it as though it were a fact — depending on the field, it is hidden, replaced with "To be confirmed", or shown as an explicit request CTA. So a half-filled config is safe to preview; it simply shows less.

That is intentional and load-bearing. **Do not replace a placeholder with a guess.** Never invent prices, discounts, availability, distances, travel times, launch dates, school information, awards, sales figures, rental yields or investment returns.

### Distances and travel times

Every amenity carries a `quality` field:

- `verified` — you measured or sourced it and can cite the source.
- `approximate` — sourced but rounded or indicative.
- `unverified` — not yet checked. Rendered as "To be confirmed".

The badge on each row shows which, and the section footer states that unmarked figures are approximate. Do not set `verified` unless you can produce the source.

---

## 4. Editing the agent details

`src/data/agent.ts` is the single source of truth for the salesperson. Components import from it; nothing is duplicated.

Fill in, at minimum:

```ts
ceaRegistrationNumber: '01234A',        // your CEA registration
agencyLicenceNumber:  'L3008899K',      // Huttons' estate agency licence
mobileE164:           '6591234567',     // digits only, with 65, no plus sign
mobileDisplay:        '+65 9123 4567',  // how it reads on the page
whatsappE164:         '6591234567',
email:                'you@example.com',
```

`mobileE164` and `whatsappE164` are digits only — the helpers build `tel:+65…` and `https://wa.me/65…` from them. **While these are placeholders, the Call and WhatsApp buttons are not rendered at all.** No button on this site ever pretends to do something it cannot.

The CEA registration number, agency name and agency licence number appear in the footer, the agent profile and the contact panel — that placement is deliberate, because a Singapore property advertisement must identify the salesperson and the agency.

Do not add awards, team size, sales volume, transaction counts, years of experience, testimonials, rankings or media features. There are no fields for them, by design.

---

## 5. Adding images

Drop files into `public/images/…` and point `project.media` at them. Placeholder SVGs ship in each directory so nothing is ever broken while you work.

| Slot           | Path                               | Recommended size                     |
| -------------- | ---------------------------------- | ------------------------------------ |
| Hero (desktop) | `public/images/hero/`              | 2000 × 1200, WebP or AVIF            |
| Hero (mobile)  | `public/images/hero/`              | 900 × 1100 (portrait crop)           |
| Gallery        | `public/images/gallery/`           | 1600 × 1067, WebP or AVIF            |
| Floorplans     | `public/images/floorplans/`        | 1200 × 1500, PNG or WebP             |
| Location map   | `public/images/map/`               | 1600 × 1000, static export           |
| Brochure cover | `public/images/brochure/`          | 900 × 1291 (page 1, front half only) |
| Project logo   | `public/images/project-logo.svg`   | SVG, transparent, tight to the ink   |
| Developer logo | `public/images/developer/`         | SVG or transparent PNG               |
| Agent portrait | `public/images/agent/`             | 720 × 900                            |
| Social share   | `public/images/placeholder-og.png` | 1200 × 630, **PNG or JPG** (not SVG) |

Rules the template enforces:

- **Always update `width` and `height` in the config to the real pixel dimensions.** They are rendered as attributes and are what keeps Cumulative Layout Shift at zero.
- **Always write real alt text.** Describe what the image shows, not "image of project".
- The hero is the LCP element: it loads eagerly with `fetchpriority="high"`. Everything below the fold is lazy-loaded.
- Mark renders as `isArtistImpression: true` — the tile gets a visible badge and the lightbox footer says so.

Converting to WebP, if you have ImageMagick:

```bash
magick input.jpg -resize 2000x -quality 82 public/images/hero/hero.webp
```

Only publish images you have permission to publish. Developer renders usually require written authorisation.

---

## 6. Adding the brochure and price list

Put the authorised PDF in `public/brochure/` and set the path:

```ts
brochure: {
  file: '/brochure/project-e-brochure.pdf',
  fileSize: '12 MB',
  lastUpdated: '2026-08-10',
}
```

With a file configured the section shows **View Brochure** (new tab) and a separately labelled **Download**. With the placeholder in place it shows a request CTA instead. Either way the Brochure nav link only ever scrolls — it never triggers a download, which is both a Google Ads destination-experience requirement and simply better behaviour.

The price-list document works the same way via `pricing.priceListDocument`.

---

## 7. Switching the visual theme

Three themes ship, in `src/styles/themes.css`. Change one line in `src/data/site.ts`:

```ts
theme: 'urban-editorial',  // 'garden-contemporary' | 'coastal-minimal'
```

| Theme                   | Character                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| **Urban Editorial**     | Bronze accent, serif display, tight rhythm, 21:9 cinematic hero, flat hairline cards                      |
| **Garden Contemporary** | Deep green accent, softer 16:9 hero, looser rhythm, rounded cards with a subtle shadow                    |
| **Coastal Minimal**     | Cool grey-blue accent, cooler paper, airy rhythm, square-cornered borderless cards, sentence-case buttons |

Each theme changes accent colour, type pairing, spacing rhythm, hero crop, image radius, card treatment and section backgrounds. None of them changes navigation structure, information hierarchy, tracking, legal disclosures or accessibility — those are fixed.

To adjust a theme, edit its token block. Global tokens (type scale, spacing scale, layout widths) live in `src/styles/global.css`.

### Fonts

The template ships with system and classic-serif fallback stacks: zero network cost, zero layout shift, and it looks intentional out of the box. To use a licensed display face:

1. Put the `.woff2` files in `public/fonts/`.
2. Uncomment the `@font-face` block in `src/layouts/BaseLayout.astro`.
3. Add the family name to the front of `--font-display` / `--font-sans` in the theme block.

Keep `font-display: swap` and tune `size-adjust` against the fallback so nothing shifts when the webfont arrives.

---

## 8. Connecting the contact form

The form posts to `src/pages/api/lead.ts`, which validates on the server, records consent, and hands the lead to an adapter (`src/utils/leadAdapter.ts`).

Set the mode in `.env` (copy `.env.example` first):

```bash
LEAD_DELIVERY_MODE="console"   # console | webhook | email | telegram
```

**`console`** — development only. Leads are logged to the server console and delivered nowhere. The form displays a red "Development mode" banner saying exactly that. The form never claims to be connected to a CRM when it is not.

**`webhook`** — POSTs the lead as JSON to `LEAD_WEBHOOK_URL`. Works with a CRM endpoint, Zapier, Make, n8n, or a Google Apps Script Web App writing into a Google Sheet. Set `LEAD_WEBHOOK_SECRET` and verify the `X-Webhook-Secret` header on the receiving end.

**`email`** — sends a transactional email. The example call targets Resend; swap the `fetch` in `deliverViaEmail()` for your provider and set `LEAD_EMAIL_API_KEY`, `LEAD_EMAIL_FROM` and `LEAD_EMAIL_TO`.

**`telegram`** — sends a formatted message straight to a Telegram chat through your own bot. No third-party service sits in between, and the notification lands on your phone in a second or two. See below.

Secrets live in environment variables only. Nothing sensitive is ever bundled into the browser — only `PUBLIC_`-prefixed variables reach the client.

### Telegram lead alerts

The fastest way to get a lead onto your phone.

**1. Create the bot.** In Telegram, message [@BotFather](https://t.me/BotFather):

- Send `/newbot`
- Give it a display name, e.g. `Chuan Park Leads`
- Give it a username ending in `bot`, e.g. `chuan_park_leads_bot`

BotFather replies with a token like `8123456789:AAH...`. That is `TELEGRAM_BOT_TOKEN`.

**2. Find your chat id.** A bot cannot message you until you have messaged it first.

- Open your new bot and press **Start** (or send it any message)
- Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser
- Find `"chat":{"id":123456789` — that number is `TELEGRAM_CHAT_ID`

For a shared team channel instead: create a group, add the bot to it, send a message, and use the same `getUpdates` URL. **Group ids are negative** (e.g. `-1001234567890`) — include the minus sign.

**3. Set the mode and two secrets.** `LEAD_DELIVERY_MODE` goes in `wrangler.jsonc` under `vars`; the token and chat id are secrets, set in the Cloudflare dashboard under Settings → Variables and Secrets (or `npx wrangler secret put NAME`). Locally, put all three in `.dev.vars`:

```bash
LEAD_DELIVERY_MODE="telegram"
TELEGRAM_BOT_TOKEN="8123456789:AAH..."
TELEGRAM_CHAT_ID="123456789"
```

Redeploy. Each lead arrives as:

```
New enquiry — Chuan Park

Tan Wei Ming
📱 9123 4567          ← tap to call
✉️ Email: tan@example.com

Wants: Book a showflat appointment
Unit type: 3 Bedroom (Luxury)
Prefers: WhatsApp
Viewing date: 2026-08-20

💬 Keen on a high floor, budget 2.5m.

Source: google / cpc / chuan-park-brand
2026-08-18T10:00:00Z
```

The phone number is a `tel:` link, so a lead is one tap from a call. Campaign source comes from the UTM parameters, falling back to "Google Ads" when only a click id is present, then to the referrer, then to "direct".

**Keep the bot token private.** Anyone holding it can post as your bot. If it leaks, send `/revoke` to BotFather and update the variable.

**If a lead does not arrive**, the server log carries Telegram's own explanation — `chat not found` means a wrong chat id, `Unauthorized` means a wrong or revoked token. The form never reports success for a lead that was not delivered, so a broken bot shows the visitor an error rather than silently swallowing the enquiry.

### What is captured

Enquiry fields, plus: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid`, landing-page URL, referrer, user agent, submission timestamp, both consent states, the exact consent wording shown, and a consent timestamp.

Click IDs persist in `sessionStorage`, so attribution survives an internal navigation.

### Anti-spam and rate limiting

- A honeypot field, hidden from people and from assistive technology.
- A minimum fill-time check (`LEAD_MIN_FILL_SECONDS`, default 1.5 seconds).
- Per-IP rate limiting (`LEAD_RATE_LIMIT_MAX`, `LEAD_RATE_LIMIT_WINDOW_SECONDS`).
- Cloudflare Turnstile, optional — see below.

**The rate limiter is in-memory and therefore best-effort.** Worker isolates do not share memory. For real protection add one of: a Cloudflare WAF rate-limiting rule on `/api/lead`; a shared counter in Workers KV or Durable Objects (replace `hit()` in `src/utils/rateLimit.ts`); or Turnstile, below.

#### Turning on Cloudflare Turnstile

Turnstile is a CAPTCHA alternative that usually shows nothing more than a "Success!" tick. It is off until both keys are set, and **the site does not need to be hosted on Cloudflare** — it is just an API.

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → **Add site**.
2. Enter your domain. Add `localhost` too if you want it working in development.
3. Widget mode **Managed** is the sensible default.
4. Copy the two keys it gives you:
   - **Site key** → `PUBLIC_TURNSTILE_SITE_KEY` (public; it ships to the browser)
   - **Secret key** → `TURNSTILE_SECRET_KEY` (server-side only; never commit it)
5. Put `PUBLIC_TURNSTILE_SITE_KEY` in `wrangler.jsonc` under `vars`, and `TURNSTILE_SECRET_KEY` in the Cloudflare dashboard as a **secret**. Locally, both go in `.dev.vars`.
6. Redeploy. Astro inlines the site key at build time, so a rebuild is required — setting the variable alone does nothing.

Set **both or neither**. The site key renders the widget; the secret makes `/api/lead` verify the token with Cloudflare. A widget with no secret is decoration, and a secret with no widget refuses every submission.

To test without real traffic, Cloudflare publishes dummy keys — site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` always passes; `2x00000000000000000000AB` with `2x0000000000000000000000000000000AA` always fails.

**The trade-off.** Turnstile needs JavaScript. Everything else on this page works without it — including this form, which falls back to a plain POST — but once Turnstile is enabled a no-JS submission arrives with no token and is refused. The honeypot, fill-time check and rate limit keep working either way, so leaving Turnstile off is a defensible choice until you actually see spam.

Verification **fails closed**: if Cloudflare cannot be reached, the submission is rejected rather than waved through. And because a token is single-use, the client requests a fresh one after any failed submit — otherwise a visitor who mistyped their phone number would be locked out of their second attempt.

### Consent

Two separate checkboxes, neither pre-checked:

1. **Required** — consent to be contacted about this enquiry, with a direct link to the Privacy Policy.
2. **Optional** — consent to future marketing about other launches, withdrawable.

Both states, the wording shown, and a timestamp are stored with the submission.

### Without JavaScript

The form is a plain `POST`. The server validates, delivers, and either redirects to `/thank-you` (303) or returns a readable 400 page listing what to correct. A success page is never shown for a submission that did not succeed.

---

## 9. Tracking, consent and Google Ads

### IDs

Placeholders live in `src/data/site.ts` under `tracking`. **While they remain placeholders, no tag is loaded and the site makes zero third-party requests.** Replace them only once the containers exist:

```ts
googleTagManagerId:       'GTM-XXXXXXX',
googleAnalyticsId:        'G-XXXXXXXXXX',
googleAdsConversionId:    'AW-XXXXXXXXX',
googleAdsConversionLabel: '[CONVERSION LABEL]',
metaPixelId:              '[META PIXEL ID]',
```

### Events

Every conversion-relevant interaction pushes to `window.dataLayer`:

`view_project` · `click_whatsapp` · `click_call` · `book_showflat` · `request_price_list` · `request_floorplans` · `view_brochure` · `request_brochure` · `download_brochure` · `view_gallery` · `form_start` · `form_error` · `form_submit` · `generate_lead`

Wiring in GTM:

1. Create a **Custom Event** trigger per event name.
2. Attach a Google Ads Conversion tag to `generate_lead` as the primary conversion. `book_showflat`, `request_price_list` and `click_whatsapp` make reasonable secondary signals.
3. `generate_lead` fires only after a submission the server actually accepted — once, never twice (the JS path sets a flag the thank-you page respects).

Components opt in declaratively, so adding tracking to a new CTA is one attribute:

```html
<a href="#contact" data-track="book_showflat" data-track-location="hero">Book Showflat</a>
```

### Consent Mode v2

Defaults are set inline, before any tag, and are **denied** for `ad_storage`, `ad_user_data`, `ad_personalization` and `analytics_storage`. The consent notice calls `gtag('consent','update', …)` on a choice and persists it. The Meta Pixel is injected only after acceptance.

The notice is a small dismissible bar — not an entry interstitial, which would be both hostile and a Google Ads destination-experience problem.

### Deliberately not implemented

**Enhanced conversions.** They require a lawful basis and consent, accepted customer-data terms in Google Ads, and server-side hashing. Turning them on casually would send hashed personal data without a proper basis. Implement them deliberately, or not at all.

### Privacy in tracking

No name, email, phone number or message text ever enters a data-layer event, an analytics parameter or a URL. Only event names and coarse placement labels such as `hero` or `mobile_bar`.

### Landing page requirements

The template addresses the common Google Ads disapproval causes: AdsBot explicitly allowed in `robots.txt`; content server-rendered and crawlable; no forced redirect, pop-under, entry interstitial or automatic download; working back button; no misleading or dead buttons; the operator, CEA registration and agency licence stated visibly; last-updated dates shown; and the source status of pricing and availability stated plainly.

**No claim is made that approval is guaranteed.** Review policy yourself, and note that the final URL must match your display domain.

---

## 10. Deploying to Cloudflare Workers

The `@astrojs/cloudflare` adapter is configured. Content pages prerender to static HTML served from Cloudflare's edge; only `/api/lead` runs as a Worker.

`wrangler.jsonc` at the project root holds the deployable configuration. It deliberately omits `main` and `assets` — the adapter fills those in and writes the final config to `dist/server/wrangler.json` during the build. Setting `main` in the root file breaks the build, because it points at a file that does not exist until the build finishes.

**Via the CLI:**

```bash
npm run deploy
```

That runs `astro build` then `wrangler deploy`. First run opens a browser to authorise Wrangler.

**Via Git:** connect the repository in the Cloudflare dashboard under **Workers & Pages**. Build command `npm run build`; Wrangler picks up `wrangler.jsonc` automatically.

### Environment variables and secrets

Two different places, and getting this wrong is the usual cause of "the form works but nothing arrives":

- **Non-secret values** go in `wrangler.jsonc` under `vars` — currently just `LEAD_DELIVERY_MODE`. Committed to the repository.
- **Secrets** go in the dashboard under **Settings → Variables and Secrets**, or via `npx wrangler secret put NAME`. Never in the repository.

The names must match exactly what the code reads:

| Name                        | Where  | Purpose                                         |
| --------------------------- | ------ | ----------------------------------------------- |
| `LEAD_DELIVERY_MODE`        | `vars` | `console` \| `webhook` \| `email` \| `telegram` |
| `TELEGRAM_BOT_TOKEN`        | secret | Telegram mode                                   |
| `TELEGRAM_CHAT_ID`          | secret | Telegram mode                                   |
| `TURNSTILE_SECRET_KEY`      | secret | Turnstile, if enabled                           |
| `PUBLIC_TURNSTILE_SITE_KEY` | `vars` | Turnstile, if enabled                           |
| `PUBLIC_SITE_URL`           | `vars` | Canonical URL, OG tags, sitemap                 |

A name like `LEAD_TELEGRAM_BOT_TOKEN` is simply not read — `/api/lead` looks for `TELEGRAM_BOT_TOKEN`, finds nothing, and reports a delivery failure.

`PUBLIC_`-prefixed values are inlined at build time, so changing one requires a **redeploy**, not just a variable update. Secrets are read at request time and take effect immediately.

### Testing locally against the real runtime

`npm run dev` uses Astro's Node dev server, which is fine for the pages but does not reproduce the Worker. To exercise the actual deployed shape:

```bash
npm run build && npm run preview
```

`npm run preview` runs `wrangler dev`, which boots the Worker in workerd exactly as Cloudflare does. Put local secrets in a `.dev.vars` file at the project root (gitignored, same `KEY="value"` format as `.env`) — shell environment variables are **not** passed through to the Worker.

Then check the endpoint is live:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8787/api/lead
```

**400** means it is running and rejecting an empty submission, which is correct. **404** means the route is not deployed as a function.

### After the first deploy

1. Add the custom domain in the dashboard and let Cloudflare issue the certificate.
2. Set `PUBLIC_SITE_URL` and update the `Sitemap:` line in `public/robots.txt`. Until you do, canonical and Open Graph tags point at `example.com`.
3. Redeploy so the canonical URL, Open Graph tags and sitemap use the real domain.

---

## 11. Duplicating for the next launch

1. Copy the repository to a new directory (or use it as a GitHub template).
2. Replace `src/data/project.ts`.
3. Replace the images in `public/images/`.
4. Set every `verification` flag back to `false` and work through them again.
5. Pick a theme in `src/data/site.ts`.
6. Update `PUBLIC_SITE_URL`, `robots.txt`, and the worker name and domain in `wrangler.jsonc`.
7. Create a fresh Google Ads conversion label if you want per-project reporting.

`src/data/agent.ts` carries over unchanged — that is the point of keeping it separate.

---

## 11a. Image assets — current state

Every image on the site was extracted from the two Huttons documents at the
repository root, at the resolution those PDFs actually hold. Nothing is a
screen grab and nothing is upscaled — but the source renders top out around
1,550–2,200 px wide, so the hero is below the 2000 x 1200 the template asks
for. It is sharp at 1x and acceptable at 2x on a phone; replace it from the
developer's marketing pack before spending real money on traffic.

| Slot                              | Current                | Source                                                                                                                        |
| --------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `hero/towers-dusk.webp` + mobile  | 1554 x 874 / 745 x 931 | sales kit p1 — the hero, still, the LCP image                                                                                 |
| `gallery/*.webp` (10)             | 1054–1600 px wide      | sales kit pp. 2–8, catalogue pp. 2, 10; plus the site plan                                                                    |
| `gallery/10-vicinity.webp`        | 1585 x 945             | sales kit p66 — a photograph, not a render. **Currently unused**: kept on disk so `media.locationImage` can point back at it. |
| `map/location-map.webp`           | 1800 x 1455            | catalogue p4 location map                                                                                                     |
| `site-plan.webp`                  | 1946 x 950             | sales kit p10                                                                                                                 |
| `floorplans/*.webp` (14)          | 1080 x 1160            | catalogue pp. 13–26, trimmed onto one canvas                                                                                  |
| `developer/kingsford-logo.webp`   | 1600 x 381             | catalogue p27 rendered at 10x, keyed to transparency                                                                          |
| `project-logo.png` / `-light.png` | 600 x 168              | sales-kit slide master, keyed to transparency                                                                                 |
| `brochure/brochure-cover.webp`    | 900 x 1273             | catalogue page 1, rendered from the PDF                                                                                       |
| `agent/ethan-goh.webp`            | 400 x 514              | **carried over — too small.** Renders at 338 CSS px, so it is soft on any 2x screen. Supply a 720 x 900 original.             |

The floorplan sheets are trimmed of their white margin and placed on a common
1080 x 1160 canvas, so the cards line up and the drawing fills the thumbnail
rather than floating in it. To regenerate after a plan reissue, re-extract the
catalogue pages and repeat the trim.

All fourteen sheets are reachable from the page. Each card shows one thumbnail
and lists every sheet in its group by the developer's own layout code — B1, C3a,
D2 and so on — and each code opens that sheet in the lightbox. The codes are
derived in `unitGroups.ts` by stripping the storey suffix from the layout codes
in `availability`, so adding a layout adds its plan chip automatically.

### The hero

A single still, no animation: the establishing view of both towers over the
lagoon pool at dusk. That is a deliberate choice over the prettier detail shots —
cabanas, lap pool, clubhouse — which are generic enough to belong to any
condominium in Singapore. Someone arriving from an ad should be able to see what
the development is before reading a word; the detail shots do that job in the
gallery instead.

It is the LCP element: eager, `fetchpriority="high"`, with a separate 4:5 mobile
crop and explicit dimensions so it costs nothing in layout shift.

An earlier version cross-faded three frames on a slow loop. That has been removed
outright — component, CSS and the two extra frame pairs — rather than left behind
switched off. The frames came from sales kit pp. 1 and 3 and are in the git history
if they are ever wanted again.

When you drop replacements in, update the matching `width`/`height` fields in
`src/data/project.ts` to the real pixel sizes — those attributes are what hold
Cumulative Layout Shift at zero, so a wrong number is worse than none.

**Permission is still outstanding.** These are Huttons marketing documents.
`verification.permissionToUseImages`, `permissionToUseLogos` and
`permissionToUseBrochure` are all `false`, and should stay that way until you
have written authorisation to republish them.

---

## 12. Pre-publication checklist

`src/data/project.ts` ends with a `verification` block. Every flag starts `false`, and the build prints the outstanding ones. Set a flag to `true` only after checking it against an authorised source:

Project name · developer · location · tenure · unit count · preview date · booking date · expected TOP · prices · availability · floorplans · project images · distance claims · travel-time claims · school information · agency appointment status · developer appointment status · permission to use logos · permission to use the brochure · permission to use project images · agent CEA details.

Also confirm before launch:

- [ ] CEA registration number and Huttons licence number are filled in and correct.
- [ ] Mobile, WhatsApp and email are real and reach you.
- [ ] The independent-website disclosure is visible in the hero, the developer section, the contact panel and the footer.
- [ ] The words "official", "exclusive", "direct developer" appear nowhere — unless you hold written authorisation.
- [ ] Every price carries a last-updated date.
- [ ] Every render is labelled as an artist's impression.
- [ ] Privacy Policy, Terms and Disclaimer have been reviewed by a qualified professional and edited to match your actual practices (including the retention period, which is a placeholder).
- [ ] `npm run verify`, `npm test`, `npm run a11y` and `npm run linkcheck` all pass.
- [ ] Lighthouse mobile run is acceptable.
- [ ] The final URL matches the Google Ads display domain, over HTTPS.

---

## 13. Project structure

```
├── astro.config.mjs          Astro + sitemap + Cloudflare adapter
├── wrangler.jsonc            Cloudflare Worker name, compat flags, vars
├── public/_headers           Security headers, cache policy
├── playwright.config.ts      E2E config (starts the dev server)
├── .pa11yci.json             Accessibility audit targets
├── .env.example              Every environment variable, documented
├── public/
│   ├── robots.txt            AdsBot explicitly allowed
│   ├── site.webmanifest
│   ├── favicon.svg, icon-*.png, apple-touch-icon.png
│   ├── brochure/             Authorised PDFs go here
│   └── images/               hero · gallery · floorplans · map · brochure · developer · agent
├── src/
│   ├── data/
│   │   ├── project.ts        ← the file you edit per launch
│   │   ├── agent.ts          ← the file you edit once
│   │   └── site.ts           Theme, tracking IDs, legal copy, navigation
│   ├── layouts/
│   │   ├── BaseLayout.astro  head, chrome, global script
│   │   └── LegalLayout.astro
│   ├── components/
│   │   ├── Header.astro          Sticky nav, mobile menu, scroll-spy
│   │   ├── Hero.astro
│   │   ├── QuickFacts.astro
│   │   ├── About.astro
│   │   ├── Location.astro        Static map, on-demand interactive map
│   │   ├── PriceTable.astro
│   │   ├── Floorplans.astro      Filters + lightbox triggers
│   │   ├── Brochure.astro
│   │   ├── Gallery.astro
│   │   ├── Developer.astro
│   │   ├── Faq.astro             Native details/summary accordion
│   │   ├── ContactForm.astro
│   │   ├── AgentProfile.astro
│   │   ├── MobileContactBar.astro
│   │   ├── Footer.astro
│   │   ├── ConsentNotice.astro
│   │   ├── Lightbox.astro        Shared dialog for plans and gallery
│   │   ├── Analytics.astro       Consent Mode + conditional tags
│   │   └── SectionHeader.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── privacy.astro · terms.astro · disclaimer.astro
│   │   ├── thank-you.astro · 404.astro
│   │   └── api/lead.ts       Server-side validation and delivery
│   ├── styles/
│   │   ├── global.css        Tokens, reset, primitives, components
│   │   └── themes.css        The three themes
│   └── utils/
│       ├── validation.ts     Shared client/server validation
│       ├── leadAdapter.ts    console | webhook | email delivery
│       ├── rateLimit.ts
│       ├── structuredData.ts JSON-LD builders
│       ├── tracking.ts       Event contract and GTM notes
│       ├── verification.ts   Build-time pre-publication report
│       └── format.ts
└── tests/landing.spec.ts     Playwright suite
```

---

## 14. Performance and accessibility notes

**Targets — not guarantees.** Real scores depend on your images, your tags and the network. Aim for Lighthouse Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95; LCP < 2.5 s, INP < 200 ms, CLS < 0.1.

What the template does to get there:

- No UI framework, no jQuery, no animation library. Total first-party JavaScript is a few kilobytes.
- No web font by default, so no font-loading shift.
- Every image carries explicit dimensions; below-the-fold images lazy-load.
- The interactive map is fetched only when a visitor asks for it.
- No tag loads while tracking IDs are placeholders.
- CSS is inlined where small and minified with Lightning CSS.

Accessibility — `npm run a11y` runs axe-core against every page at both viewports, including the opened lightbox and the opened mobile menu, and currently reports zero WCAG 2.1 A/AA violations. Automated tooling catches perhaps a third to a half of real problems, so keyboard-test the form, the menu and the lightbox by hand before launch.

- Semantic landmarks, one `h1`, ordered heading levels, skip link.
- Full keyboard support; visible focus rings on everything interactive.
- The lightbox uses a native `<dialog>`: Escape closes it, focus is trapped, focus returns to the trigger.
- The mobile menu traps focus, closes on Escape, closes on selection, and locks background scroll.
- The form has real labels, inline errors, an error summary that receives focus, and `aria-invalid` on failed fields.
- Availability and source quality are always conveyed by text, never by colour alone.
- All motion is gated behind `prefers-reduced-motion`.
- Touch targets are at least 44 × 44 px.
- The mobile contact bar hides itself while the form has focus, so it can never cover the submit button.

---

## 15. What this template deliberately will not do

These are design decisions, not omissions:

- No countdown timers, "selling fast" banners, fake scarcity or crossed-out prices.
- No testimonials, ratings, review counts, awards or media logos — no fields exist for them.
- No `Offer`, `AggregateOffer`, `Review` or `AggregateRating` structured data. Indicative prices are not offers, and there are no reviews.
- No entry pop-up, no full-screen form on load, no forced redirect, no automatic download.
- No claim of being official, exclusive, or direct-from-developer.
- No investment-return, rental-yield, capital-appreciation, loan-approval or school-admission promise.
- No enhanced conversions until they are configured deliberately and lawfully.

If a stakeholder asks for one of these, the honest answer is that it raises real regulatory and ad-account risk and tends to cost more in disapprovals and complaints than it gains in clicks.

---

## Known dependency advisories

`npm audit` reports 5 issues, all in build- or development-time dependencies, all already on their latest published versions:

- Remaining advisories are build-time only, in dev dependencies. Re-check with `npm audit` before each release.
- `uuid` / `gaxios` (via `linkinator`, a dev-only link checker).

Neither ships in the browser bundle or the serverless function's request path. Re-check with `npm audit` before each deploy in case a fix lands.

---

## Licence and responsibility

The code is yours to use and adapt. The content is your responsibility: the legal pages are templates that need professional review, and every project fact must be verified against authorised sources before publication. No representation is made that this template, as shipped, satisfies the PDPA, the Estate Agents Act, CEA advertising guidelines, Google Ads policy or any other requirement.
