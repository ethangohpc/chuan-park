/**
 * SITE CONFIGURATION
 * ===========================================================================
 * Site-wide settings: theme selection, tracking IDs, legal disclosures and
 * navigation. Project-specific content lives in `project.ts`; agent details
 * live in `agent.ts`.
 */

export type ThemeName = 'urban-editorial' | 'garden-contemporary' | 'coastal-minimal';

export interface NavItem {
  label: string;
  href: string;
  /** The section id used for scroll-spy. */
  id: string;
}

export interface SiteConfig {
  /** Production URL. Also set PUBLIC_SITE_URL in the environment. */
  url: string;
  /** Visual theme — see src/styles/themes.css. */
  theme: ThemeName;
  /** Set false to add <meta name="robots" content="noindex"> across the site. */
  indexable: boolean;
  locale: string;
  region: string;
  currency: string;
  navigation: NavItem[];
  /**
   * Cloudflare Turnstile site key. PUBLIC by design — it is rendered into the
   * HTML as a data-sitekey attribute, so committing it leaks nothing.
   *
   * It lives here rather than in an environment variable because Astro inlines
   * PUBLIC_* at BUILD time: as a Cloudflare build variable it would have to be
   * present on whichever machine runs the build, and would silently vanish —
   * taking the widget with it — the first time anyone built elsewhere.
   * PUBLIC_TURNSTILE_SITE_KEY still overrides it.
   *
   * MUST be paired with the TURNSTILE_SECRET_KEY Worker secret. A widget with
   * no server check is decoration; a server check with no widget refuses every
   * submission. Empty here means Turnstile is off entirely, which is a valid
   * state — the honeypot, fill-time check and rate limit still apply.
   */
  turnstileSiteKey: string;
  tracking: TrackingConfig;
  legal: LegalConfig;
}

export interface TrackingConfig {
  /**
   * Leave these as placeholders until the real containers exist. No tracking
   * script is injected while a value is still a placeholder, so the page stays
   * fast and no requests are made without a configured, consented tag.
   */
  googleTagManagerId: string; // GTM-XXXXXXX
  googleAnalyticsId: string; // G-XXXXXXXXXX
  googleAdsConversionId: string; // AW-XXXXXXXXX
  googleAdsConversionLabel: string; // [CONVERSION LABEL]
  metaPixelId: string; // [META PIXEL ID]
  /**
   * Google Consent Mode v2 defaults. These are applied BEFORE any tag loads.
   * 'denied' is the privacy-preserving default; the consent notice updates
   * them when the visitor makes a choice.
   */
  consentMode: {
    enabled: boolean;
    defaults: {
      ad_storage: 'granted' | 'denied';
      ad_user_data: 'granted' | 'denied';
      ad_personalization: 'granted' | 'denied';
      analytics_storage: 'granted' | 'denied';
      functionality_storage: 'granted' | 'denied';
      security_storage: 'granted' | 'denied';
    };
    /** Region codes that get the strict default (e.g. ['SG','EU']). Empty = all. */
    regions: string[];
  };
}

export interface LegalConfig {
  /**
   * Set to true ONLY if you hold written authorisation from the developer to
   * describe this as an official site. Leaving it false keeps the independent
   * marketing disclosure visible, which is the safe default.
   */
  claimsOfficialDeveloperSite: false;
  independentDisclosureShort: string;
  independentDisclosureFull: string;
  imageDisclaimer: string;
  pricingDisclaimer: string;
  floorplanDisclaimer: string;
  /** Bullet points rendered on /disclaimer and in the footer disclosure block. */
  projectDisclaimer: string[];
  privacyContactEmail: string;
  /** Shown at the top of every legal page. */
  legalTemplateNotice: string;
}

export const site: SiteConfig = {
  /* Must match SITE_URL in astro.config.mjs — see the note there. */
  url: import.meta.env.PUBLIC_SITE_URL || 'https://chuanpark.rsvp-home.com',

  // Switch between 'urban-editorial' | 'garden-contemporary' | 'coastal-minimal'
  theme: 'garden-contemporary',

  // Keep false while the site is a work in progress, then set true to allow
  // indexing. Google Ads traffic works either way; this only affects organic.
  indexable: true,

  locale: 'en-SG',
  region: 'SG',
  currency: 'SGD',

  /* The "ETHANLEADS" widget, scoped to rsvp-home.com and its subdomains. */
  turnstileSiteKey: '0x4AAAAAAET3V1_fQpuL_01G',

  navigation: [
    { label: 'About', href: '#about', id: 'about' },
    { label: 'Location', href: '#location', id: 'location' },
    { label: 'Price', href: '#price', id: 'price' },
    { label: 'Floorplans', href: '#floorplans', id: 'floorplans' },
    { label: 'Brochure', href: '#brochure', id: 'brochure' },
    { label: 'Gallery', href: '#gallery', id: 'gallery' },
    { label: 'About the Developer', href: '#developer', id: 'developer' },
    { label: 'FAQ', href: '#faq', id: 'faq' },
    { label: 'Contact', href: '#contact', id: 'contact' },
  ],

  tracking: {
    // DO NOT paste live IDs into the repository unless you intend them to be
    // public. Prefer setting them here only after the containers exist.
    googleTagManagerId: 'GTM-XXXXXXX',
    googleAnalyticsId: 'G-XXXXXXXXXX',
    /* Live Google Ads account. Loaded via gtag directly, since no GTM
       container is configured — see Analytics.astro. */
    googleAdsConversionId: 'AW-18418164630',
    /*
     * The conversion action's label, the part after the slash in
     * "AW-18418164630/AbCdEfGh1234". Create the conversion action in Google Ads
     * (Goals → Conversions → New, "Website", set up manually with a tag), and
     * paste its label here.
     *
     * WITHOUT IT NO CONVERSION IS RECORDED. The tag loads and Ads sees traffic,
     * but `generate_lead` never becomes a countable conversion, so smart
     * bidding has nothing to optimise towards. The wiring is already in
     * Analytics.astro and starts working the moment this is filled in.
     */
    googleAdsConversionLabel: '[CONVERSION LABEL]',
    metaPixelId: '[META PIXEL ID]',
    consentMode: {
      enabled: true,
      defaults: {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
      },
      regions: [],
    },
  },

  legal: {
    claimsOfficialDeveloperSite: false,

    independentDisclosureShort:
      'Independent marketing website — not the official developer website.',

    independentDisclosureFull:
      'This is an independent property marketing website operated by Ethan Goh, a CEA-registered salesperson with Huttons Asia Pte Ltd. It is not the official developer website.',

    imageDisclaimer:
      'Images and artists’ impressions are for illustration purposes only and may not represent the final completed development.',

    pricingDisclaimer:
      'Prices, unit availability and promotional arrangements are indicative and subject to change. Please request the latest developer-issued price list for confirmation.',

    floorplanDisclaimer:
      'Floorplans are indicative and subject to change. Areas are approximate, may include void, air-conditioner ledge and other non-enclosed spaces, and are subject to final survey. Availability changes without notice.',

    projectDisclaimer: [
      'Information on this website is provided for general reference only.',
      'Information may be subject to change without notice.',
      'Prices, unit availability and payment arrangements must be reconfirmed against the latest developer-issued documents.',
      'Images, renders and visualisations may be artists’ impressions.',
      'Floor areas are approximate and subject to final survey.',
      'Nothing on this website forms part of an offer or a contract.',
      'Buyers should refer to the official sale documents, including the Option to Purchase and the Sale and Purchase Agreement.',
      'Errors and omissions are excepted.',
    ],

    privacyContactEmail: 'ethangoh.property@gmail.com',

    legalTemplateNotice:
      'This page is a template. It has not been reviewed by a lawyer and no representation is made that it satisfies the Personal Data Protection Act 2012, the Estate Agents Act 2010, CEA advertising guidelines or any other legal requirement. Have it reviewed by a qualified professional and updated to reflect your actual practices before publishing.',
  },
};
