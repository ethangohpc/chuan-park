/**
 * AGENT CONFIGURATION — SINGLE SOURCE OF TRUTH
 * ===========================================================================
 * Every component reads agent details from this file. Do not hard-code the
 * name, phone number, CEA number or agency licence anywhere else.
 *
 * IMPORTANT — REGULATORY
 * Under the Estate Agents Act and CEA advertising guidelines, property
 * advertisements must identify the salesperson, their CEA registration
 * number, the estate agency and the estate agency licence number.
 * Fill in every [PLACEHOLDER] below before publishing or running ads.
 *
 * Nothing in this file may be invented. Leave a placeholder rather than
 * guessing a number, an award, a sales figure or a testimonial.
 */

export interface SocialLink {
  label: string;
  url: string;
}

export interface AgentConfig {
  /** Working name, used everywhere on the page. */
  fullName: string;
  /** Name as it appears on the CEA Public Register. */
  registeredName: string;
  displayName: string;
  jobTitle: string;
  ceaRegistrationNumber: string;
  agencyName: string;
  agencyLicenceNumber: string;
  agencyAddress: string;
  agencyUrl: string;
  /** Digits only, with country code, no "+" — used to build tel: and wa.me links. */
  mobileE164: string;
  /** Human-readable version shown on the page. */
  mobileDisplay: string;
  whatsappE164: string;
  email: string;
  profileImage: string;
  profileImageAlt: string;
  profileImageWidth: number;
  profileImageHeight: number;
  bioShort: string;
  bioLong: string[];
  specialisations: string[];
  advisoryApproach: string[];
  socials: SocialLink[];
  /** CEA Public Register — visitors can verify registration independently. */
  ceaPublicRegisterUrl: string;
  /** Optional: direct-to-profile link once you have your register URL. */
  ceaProfileUrl: string;
  /** Languages spoken — leave empty to hide. */
  languages: string[];
}

export const agent: AgentConfig = {
  /**
   * `fullName` is the working name shown throughout the site.
   * `registeredName` is the name on the CEA Public Register — shown alongside
   * the registration number in the footer, the agent profile and the legal
   * pages so a visitor can actually look the registration up. Do not swap
   * them: the register is searched by the registered name.
   */
  fullName: 'Ethan Goh',
  registeredName: 'Goh Pei Chang Ethan',
  displayName: 'Ethan',
  jobTitle: 'Associate Division Director', // confirmed by Ethan

  // ---- VERIFY BEFORE PUBLISHING -----------------------------------------
  ceaRegistrationNumber: 'R064895H', // confirmed by Ethan
  agencyName: 'Huttons Asia Pte Ltd',
  agencyLicenceNumber: 'L3008899K', // confirmed by Ethan
  agencyAddress: '[HUTTONS REGISTERED ADDRESS]',
  /** The agency's own website, linked from the footer. Supplied by Ethan. */
  agencyUrl: 'https://www.huttonsgroup.com/',

  // Digits only including the 65 country code, e.g. '6591234567'.
  mobileE164: '6587848054', // supplied by Ethan, 13 Aug 2026
  mobileDisplay: '+65 8784 8054',
  whatsappE164: '6587848054',
  email: 'ethangoh.property@gmail.com', // supplied by Ethan, 13 Aug 2026
  // -----------------------------------------------------------------------

  profileImage: '/images/agent/ethan-goh.webp',
  profileImageAlt:
    'Portrait of Ethan Goh (Goh Pei Chang Ethan), real estate salesperson with Huttons Asia Pte Ltd',
  profileImageWidth: 400,
  profileImageHeight: 514,

  bioShort:
    'Ethan Goh is a CEA-registered salesperson with Huttons Asia Pte Ltd who focuses on Singapore private residential new launches.',

  bioLong: [
    'Ethan works with buyers evaluating new private residential launches in Singapore. His work covers project analysis, pricing comparison against nearby transactions, location and connectivity assessment, unit selection, and exit-strategy planning.',
    'The aim of a first conversation is simple: understand your budget, timeline, household needs and any existing property commitments, then set out — plainly — where a project fits and where it does not. Not every launch suits every buyer, and saying so is part of the job.',
    '[ADD FURTHER BACKGROUND — e.g. professional background, market focus, service approach. Do not add awards, transaction volumes, rankings or years of experience unless they are accurate and verifiable.]',
  ],

  specialisations: [
    'New launch project analysis',
    'Indicative pricing and PSF comparison',
    'Location and connectivity analysis',
    'Unit selection and stack comparison',
    'Exit-strategy and holding-period planning',
  ],

  advisoryApproach: [
    'Walk through the project facts, the site plan and the unit mix before discussing any unit.',
    'Compare indicative pricing against recent transactions in the same planning area.',
    'Set out the trade-offs of each stack, orientation and floor level, not only the positives.',
    'Confirm current prices and availability against the developer-issued price list before any decision.',
  ],

  socials: [
    // Remove any line you do not use — empty URLs are hidden automatically.
    { label: 'Instagram', url: '[INSTAGRAM URL]' },
    { label: 'LinkedIn', url: '[LINKEDIN URL]' },
    { label: 'YouTube', url: '[YOUTUBE URL]' },
    { label: 'TikTok', url: '[TIKTOK URL]' },
  ],

  ceaPublicRegisterUrl: 'https://www.cea.gov.sg/aceas/public-register',
  ceaProfileUrl: '[CEA PUBLIC REGISTER PROFILE URL]',

  languages: ['[LANGUAGE]'],
};

/** True when a config value is still an unfilled placeholder. */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  return /^\s*\[.*\]\s*$/.test(value);
}

/** tel: link, or null when the number has not been configured yet. */
export function telHref(): string | null {
  return isPlaceholder(agent.mobileE164) ? null : `tel:+${agent.mobileE164}`;
}

/** wa.me link with a pre-filled message, or null when not configured. */
export function whatsappHref(message: string): string | null {
  if (isPlaceholder(agent.whatsappE164)) return null;
  return `https://wa.me/${agent.whatsappE164}?text=${encodeURIComponent(message)}`;
}

/** mailto: link, or null when not configured. */
export function mailtoHref(subject?: string): string | null {
  if (isPlaceholder(agent.email)) return null;
  return subject
    ? `mailto:${agent.email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${agent.email}`;
}
