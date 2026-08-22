/**
 * STRUCTURED DATA
 * ===========================================================================
 * Emits only schema types that describe things actually shown on the page.
 *
 * DELIBERATELY NOT EMITTED
 * - Offer / AggregateOffer: prices here are indicative and not a binding
 *   offer. Marking them up invites a rich-result penalty and misstates them.
 * - Review / AggregateRating: there are no reviews on this site. Inventing
 *   them is a structured-data policy violation.
 * - Product: a new launch unit is not a product listing.
 *
 * Any field whose source value is still a `[PLACEHOLDER]` is omitted rather
 * than published as literal placeholder text.
 */

import { agent, isPlaceholder as agentPlaceholder } from '../data/agent';
import { project, isPlaceholder, verified } from '../data/project';
import { site } from '../data/site';
import { interpolate } from './format';

type Json = Record<string, unknown>;

/** Removes undefined/null/empty values recursively so no blank keys ship. */
function prune<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      const arr = value.filter((v) => v !== undefined && v !== null && v !== '');
      if (arr.length) out[key] = arr;
      continue;
    }
    if (typeof value === 'object') {
      const nested = prune(value as Json);
      if (Object.keys(nested).length) out[key] = nested;
      continue;
    }
    out[key] = value;
  }
  return out as T;
}

const absolute = (path: string) => new URL(path, site.url).href;

export function organizationSchema(): Json {
  return prune({
    '@type': 'RealEstateAgent',
    '@id': `${site.url}#agent`,
    name: agentPlaceholder(agent.fullName) ? undefined : agent.fullName,
    description: agent.bioShort,
    url: site.url,
    image: absolute(agent.profileImage),
    telephone: agentPlaceholder(agent.mobileE164) ? undefined : `+${agent.mobileE164}`,
    email: agentPlaceholder(agent.email) ? undefined : agent.email,
    areaServed: { '@type': 'Country', name: 'Singapore' },
    knowsAbout: agent.specialisations,
    memberOf: prune({
      '@type': 'Organization',
      name: agent.agencyName,
      identifier: agentPlaceholder(agent.agencyLicenceNumber)
        ? undefined
        : `CEA Licence ${agent.agencyLicenceNumber}`,
    }),
    identifier: agentPlaceholder(agent.ceaRegistrationNumber)
      ? undefined
      : `CEA Registration ${agent.ceaRegistrationNumber}`,
    sameAs: agent.socials.filter((s) => !agentPlaceholder(s.url)).map((s) => s.url),
  });
}

export function websiteSchema(): Json {
  return prune({
    '@type': 'WebSite',
    '@id': `${site.url}#website`,
    url: site.url,
    name: isPlaceholder(project.name)
      ? 'Singapore new launch information'
      : `${project.name} — information site`,
    inLanguage: site.locale,
    publisher: { '@id': `${site.url}#agent` },
  });
}

export function webPageSchema(pathname: string, title: string, description: string): Json {
  const url = absolute(pathname);
  return prune({
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    isPartOf: { '@id': `${site.url}#website` },
    about: { '@id': `${site.url}#agent` },
    inLanguage: site.locale,
    dateModified: /^\d{4}-\d{2}-\d{2}$/.test(project.lastUpdated) ? project.lastUpdated : undefined,
    primaryImageOfPage: absolute(project.media.ogImage),
  });
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/**
 * Tokens the FAQ copy is written against. Exported so the FAQ section and this
 * schema resolve answers identically — otherwise the markup could drop a
 * question the page shows, or worse, keep one it does not.
 */
export const faqReplacements: Record<string, string> = {
  'PROJECT NAME': verified(project.name) ?? '[PROJECT NAME]',
  'STREET ADDRESS': verified(project.streetAddress) ?? '[STREET ADDRESS]',
  DISTRICT: verified(project.district) ?? '[DISTRICT]',
  'SHOWFLAT ADDRESS': verified(project.showflatAddress) ?? '[SHOWFLAT ADDRESS]',
  TENURE: verified(project.tenure) ?? '[TENURE]',
  'EXPECTED TOP': verified(project.expectedTop) ?? '[EXPECTED TOP]',
  'DEVELOPER NAME': verified(project.developer) ?? '[DEVELOPER NAME]',
  'CEA REGISTRATION NUMBER': agent.ceaRegistrationNumber,
  'HUTTONS LICENCE NUMBER': agent.agencyLicenceNumber,
};

/** An answer still carrying an unfilled `[TOKEN]` is not publishable. */
export const hasUnfilledPlaceholder = (text: string) => /\[[A-Z0-9 –—/'’.-]+\]/.test(text);

/**
 * Only questions flagged `includeInStructuredData` are emitted, and only when
 * their answer text is free of unfilled placeholders — so the markup can never
 * describe content the visitor cannot see.
 */
export function faqSchema(): Json | null {
  const entries = project.faq
    .filter((item) => item.includeInStructuredData)
    .map((item) => ({
      question: interpolate(item.question, faqReplacements),
      answer: interpolate(item.answer, faqReplacements),
    }))
    .filter((item) => !hasUnfilledPlaceholder(item.answer));

  if (!entries.length) return null;

  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/**
 * Describes the residential development itself. `Residence` is used rather
 * than `Product`/`Offer` because nothing here constitutes a binding offer.
 */
export function residenceSchema(): Json | null {
  if (isPlaceholder(project.name)) return null;
  return prune({
    '@type': 'ApartmentComplex',
    '@id': `${site.url}#development`,
    name: project.name,
    url: site.url,
    numberOfAccommodationUnits: verified(project.totalUnits),
    image: absolute(project.media.heroImage),
    address: prune({
      '@type': 'PostalAddress',
      streetAddress: verified(project.streetAddress),
      postalCode: verified(project.postalCode),
      addressLocality: verified(project.locality),
      addressCountry: 'SG',
    }),
    geo:
      isPlaceholder(project.geo.latitude) || isPlaceholder(project.geo.longitude)
        ? undefined
        : {
            '@type': 'GeoCoordinates',
            latitude: project.geo.latitude,
            longitude: project.geo.longitude,
          },
  });
}

/** Assembles the final @graph for a page. */
export function buildGraph(options: {
  pathname: string;
  title: string;
  description: string;
  includeFaq?: boolean;
  includeResidence?: boolean;
  breadcrumbs?: { name: string; path: string }[];
}): string {
  const graph: Json[] = [
    organizationSchema(),
    websiteSchema(),
    webPageSchema(options.pathname, options.title, options.description),
  ];

  if (options.breadcrumbs?.length) graph.push(breadcrumbSchema(options.breadcrumbs));
  if (options.includeResidence) {
    const residence = residenceSchema();
    if (residence) graph.push(residence);
  }
  if (options.includeFaq) {
    const faq = faqSchema();
    if (faq) graph.push(faq);
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}
