/**
 * LEAD VALIDATION
 * ===========================================================================
 * Shared by the browser (progressive enhancement) and the server endpoint.
 * The server is the authority: the client-side pass exists only to give fast,
 * accessible feedback.
 */

export interface LeadInput {
  name: string;
  phone: string;
  /** Multi-select: what the enquirer wants. At least one is required. */
  interests: string[];
  /** Multi-select: which sizes they are looking at. Optional. */
  unitTypes: string[];
  message: string;
  consentEnquiry: boolean;
  consentMarketing: boolean;
  /** Honeypot — must be empty. */
  company: string;
  /** Milliseconds since the form was rendered. */
  renderedAt: string;
}

export type FieldErrors = Partial<Record<keyof LeadInput | 'form', string>>;

/**
 * Checkboxes, not a dropdown: someone booking a viewing usually also wants the
 * price list, and making them pick one lost that. Wording matches what each
 * choice actually produces.
 */
export const INTERESTS = [
  'Arrange Showflat Viewing',
  'Request for Brochure & Floorplans',
  'Request for Latest Pricelist & Available Units',
] as const;

/**
 * Singapore mobile numbers are 8 digits beginning with 8 or 9. We accept an
 * optional +65 / 65 prefix and any spacing or dashes the visitor types.
 */
const SG_MOBILE = /^(?:\+?65[\s-]?)?([89]\d{3})[\s-]?(\d{4})$/;

export function normalisePhone(raw: string): string | null {
  const trimmed = raw.replace(/[\s-]/g, '');
  const match = SG_MOBILE.exec(trimmed);
  if (!match) return null;
  return `+65 ${match[1]} ${match[2]}`;
}

export function validateLead(input: Partial<LeadInput>): FieldErrors {
  const errors: FieldErrors = {};

  const name = (input.name ?? '').trim();
  if (name.length < 2) {
    errors.name = 'Enter your name so we know who we are replying to.';
  } else if (name.length > 80) {
    errors.name = 'Please shorten your name to 80 characters or fewer.';
  }

  const phone = (input.phone ?? '').trim();
  if (!phone) {
    errors.phone = 'Enter a Singapore mobile number, for example 9123 4567.';
  } else if (!normalisePhone(phone)) {
    errors.phone =
      'That does not look like a Singapore mobile number. It should be 8 digits starting with 8 or 9.';
  }

  /*
   * Unknown values are dropped rather than rejected. A checkbox the visitor
   * cannot see cannot be their mistake, and a stale option from a cached page
   * should not cost a real enquiry.
   */
  const interests = (input.interests ?? []).filter((v) =>
    (INTERESTS as readonly string[]).includes(v)
  );
  if (!interests.length) {
    errors.interests = 'Tell us what you would like — choose at least one.';
  }

  const message = (input.message ?? '').trim();
  if (message.length > 1500) {
    errors.message = 'Please shorten your message to 1,500 characters or fewer.';
  }

  if (!input.consentEnquiry) {
    errors.consentEnquiry = 'We need your consent before we can contact you about this enquiry.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Field label lookup used by the accessible error summary. */
export const FIELD_LABELS: Record<string, string> = {
  name: 'Full name',
  phone: 'WhatsApp number',
  interests: "I'm interested in",
  unitTypes: 'Preferred unit type',
  message: 'Message',
  consentEnquiry: 'Enquiry consent',
  form: 'Form',
};
