/**
 * PROJECT CONFIGURATION — EDIT THIS FILE TO RE-USE THE TEMPLATE
 * ===========================================================================
 * The entire landing page is driven by this file. To launch a new project,
 * duplicate the repository, replace the images in /public/images and rewrite
 * the values below.
 *
 * RULES
 * 1. Never invent a price, distance, travel time, unit count, launch date,
 *    school allocation, award, sales figure or yield. Leave the placeholder.
 * 2. Any field left as a `[PLACEHOLDER]` is hidden or clearly flagged in the
 *    UI rather than rendered as if it were fact — see `isPlaceholder()`.
 * 3. Every distance and travel time must carry a source. Anything not sourced
 *    is shown as approximate and unverified.
 * 4. Do not publish developer logos, brochures, floorplans or renders unless
 *    you have permission to use them.
 *
 * PRE-PUBLICATION CHECKLIST: see `verification` at the bottom of this file.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Availability = 'available' | 'limited' | 'sold-out' | 'unreleased' | 'unverified';

export type SourceQuality = 'verified' | 'approximate' | 'unverified';

export interface Fact {
  label: string;
  value: string;
  /** Optional short note rendered under the value. */
  note?: string;
}

export interface UnitType {
  id: string;
  /** e.g. '2 Bedroom + Study' */
  name: string;
  bedrooms: number;
  /** Used by the floorplan filter chips. */
  category:
    '1-bedroom' | '2-bedroom' | '3-bedroom' | '4-bedroom' | '5-bedroom' | 'penthouse' | 'other';
  hasStudy: boolean;
  hasFlexRoom: boolean;
  /** e.g. '635 – 700 sqft'. Leave as placeholder if unverified. */
  areaSqft: string;
  areaSqm: string;
  unitCount: string;
  availability: Availability;
  /** e.g. 'Owner-occupiers wanting a dedicated work area.' */
  suitedTo: string;
  selectionNotes: string;
}

export interface PriceRow {
  unitTypeId: string;
  unitType: string;
  areaSqft: string;
  priceFrom: string;
  psf: string;
  availability: Availability;
}

export interface Layout {
  /** Developer's layout code, e.g. '1BR S1-H'. */
  code: string;
  sqft: number;
  sqm: number;
  /** Units remaining, or null when the per-layout split is not published. */
  unitsLeft: number | null;
  /** Plan image, where one has been supplied. */
  image?: string;
}

export interface AvailabilityCategory {
  id: string;
  name: string;
  category: UnitType['category'];
  /** Units remaining across the category. */
  unitsLeft: number;
  layouts: Layout[];
}

export interface GalleryImage {
  src: string;
  /** Optional larger source opened in the lightbox. Falls back to `src`. */
  full?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Renders an "Artist's impression" badge. */
  isArtistImpression: boolean;
}

export interface Amenity {
  name: string;
  /**
   * MOE-style distance band, used for schools. These mirror the primary-school
   * registration categories, so they must be measured rather than estimated —
   * see the note on the schools group before changing one.
   */
  band?: 'within-1km' | '1-2km';
  /** e.g. '450 m' or '[DISTANCE – VERIFY BEFORE PUBLISHING]' */
  distance: string;
  /** e.g. '6 min walk' */
  time: string;
  quality: SourceQuality;
  note?: string;
}

export interface AmenityGroup {
  title: string;
  /** Short intro under the group heading. Optional. */
  intro?: string;
  items: Amenity[];
}

export interface FaqItem {
  question: string;
  /** Plain text or minimal inline HTML. Rendered visibly on the page. */
  answer: string;
  /** Only questions marked true are emitted as FAQPage structured data. */
  includeInStructuredData: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when a value is still an unfilled `[PLACEHOLDER]`. */
export function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return value == null;
  return value.trim() === '' || /^\s*\[.*\]\s*$/.test(value.trim());
}

/** Returns the value, or `null` when it is still a placeholder. */
export function verified(value: string | undefined): string | null {
  return isPlaceholder(value) ? null : (value as string);
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  available: 'Available',
  limited: 'Limited units',
  'sold-out': 'Fully sold',
  unreleased: 'Not yet released',
  unverified: 'To be confirmed',
};

// ---------------------------------------------------------------------------
// Project data
// ---------------------------------------------------------------------------

export const project = {
  /**
   * SOURCES FOR THE VERIFIED FIELDS BELOW
   * -------------------------------------------------------------------------
   * A. "Huttons Chuan Park Sales Kit", Huttons Asia, information stated as
   *    current at 28 October 2024 — source of the fact sheet (slide 9), the
   *    diagrammatic chart (slide 12), the site plan, the unit-orientation and
   *    unit-view splits, and the perspectives used in the gallery.
   * B. "Chuan Park Preview Catalogue (English)", Huttons Asia, dated
   *    2 October 2024 — source of every unit layout sheet reproduced in the
   *    Floorplans section, the site plan legend, the location map, and the
   *    Kingsford Development profile.
   * C. Huttons/Ecoprop project export "Chuan-Park-R064895H-20260822.pdf",
   *    generated 22 August 2026 — source of the current "from" prices.
   * D. Huttons agent portal unit chart, viewed 22 August 2026 — source of the
   *    sold / available split reproduced in `availability`.
   *
   * A AND B ARE FROM 2024. Anything time-sensitive — price, PSF, availability,
   * showflat address — is therefore taken from C and D and carries their date,
   * or is left as a placeholder. Re-check both before quoting anything.
   *
   * Sources A and B are agency marketing documents. Confirm you are authorised
   * to reproduce their images and layout sheets before this page goes live —
   * `verification.permissionToUseImages` is false until you have.
   */

  // -- General -------------------------------------------------------------
  name: 'Chuan Park', // Source A fact sheet; the developer's mark reads "CHUAN PARK 鑫丰瑞府"
  slug: 'chuan-park',
  propertyType: 'Private residential condominium', // Source A: residential highrise
  district: 'District 19', // Source C
  planningArea: 'Serangoon (Lorong Chuan subzone)', // Source A slide 57
  streetAddress: 'Lorong Chuan', // Source A fact sheet
  /** The five blocks, from the diagrammatic chart (Source A, slide 12). */
  postalCode: 'Singapore 556744 – 556748',
  locality: 'Lorong Chuan',
  tenure: '99-year leasehold', // Source A / Source C
  developer: 'Chuan Park Development Pte Ltd', // Source A fact sheet; developer's licence C1491
  /**
   * Heading-only short form. The section copy names Kingsford Development as
   * the group behind the project company, which is how both source documents
   * describe it — Source B: "Developed by Kingsford Development (Singapore)".
   */
  developerShortName: 'Chuan Park Development Pte Ltd',
  architect: 'AGA Architects Pte Ltd', // Source A fact sheet, project team
  mainContractor: 'China Construction (South Pacific) Development Co Pte Ltd', // Source A
  totalUnits: '916 residential units', // Source A fact sheet (plus 2 shop units)
  blocks: '5 blocks (242, 244, 246, 248 and 250 Lorong Chuan)', // Source A
  storeys: '22 storeys (blocks 242, 244, 246) and 19 storeys (blocks 248, 250)', // Source A
  landSize: '37,215.60 sqm site area', // Source A fact sheet; plot ratio 2.1
  /**
   * The two sources disagree, and this is the one to watch.
   *
   * Source C (the Huttons/Ecoprop listing, 22 Aug 2026) gives "Exp TOP: Q4
   * 2027". Source A (the 2024 fact sheet) gives an estimated date of vacant
   * possession of 31 December 2028 and legal completion of 31 December 2031.
   *
   * They are not the same thing, which is why both can stand: Q4 2027 is when
   * the developer expects the Temporary Occupation Permit, while the fact-sheet
   * dates are the long-stop dates written into the sale documents. A project
   * routinely reaches TOP well before its long-stop. The hero shows the
   * expectation; the FAQ carries the contractual dates, which are the ones that
   * actually bind. Do not delete one in favour of the other.
   *
   * `verification.expectedTop` stays false until a developer-issued document
   * confirms the quarter.
   */
  expectedTop: 'Q4 2027', // Source C, 22 August 2026
  projectStatus: 'Launched and selling — 891 of 918 units sold as at 22 August 2026', // Source D
  previewDate: '[PREVIEW DATE — not stated in either source; the project is already launched]',
  bookingDate: '[BOOKING DATE — VERIFY BEFORE PUBLISHING]',
  showflatAddress: '[SHOWFLAT ADDRESS — VERIFY BEFORE PUBLISHING]',
  showflatNote:
    'Showflat viewing is strictly by appointment and viewing hours may change at short notice. Please arrange a slot before travelling.',

  /** Shown in the hero, footer and legal pages. Update whenever content changes. */
  lastUpdated: '2026-08-22',

  /** Optional geo coordinates for the static map and structured data. */
  geo: {
    latitude: '[LATITUDE]',
    longitude: '[LONGITUDE]',
  },

  // -- Pricing -------------------------------------------------------------
  /**
   * Prices are the "from" figures in the 22 August 2026 project export
   * (Source C) and apply to the units still available on that date — which is
   * why the 2 Bedroom "from" price sits above the 2 Bedroom + Study one: the
   * single remaining 2 Bedroom is an 829 sqft upper-storey unit, while the
   * remaining 2 Bedroom + Study units are 743 sqft.
   *
   * NO PSF IS PUBLISHED HERE. Source C quotes prices and areas but not PSF,
   * and dividing one by the other would assume the cheapest unit is also the
   * smallest — it is not. Fill these in from the developer price list.
   */
  pricing: {
    startingPrice: 'S$2,001,000', // Source C, 22 Aug 2026 — 2 Bedroom + Study, 743 sqft
    /**
     * Supplied by Ethan, 22 August 2026 — not calculated here. It is a genuine
     * floor: Source C publishes no PSF, and the cheapest unit is not the
     * smallest, so dividing the headline price by the smallest area would have
     * produced a different and wrong number.
     *
     * It is consistent with Source C. The 3 Bedroom from-price of S$3,234,900
     * is quoted against a 1,206 – 1,485 sqft range, which puts that unit
     * somewhere between S$2,178 and S$2,682 psf; S$2,370 sits inside that band
     * and implies an area of about 1,365 sqft. The two published fixed-area
     * types price above it — the 2 Bedroom at about S$2,493 psf and the
     * 2 Bedroom + Study at about S$2,693 — so the floor being a 3 Bedroom is
     * what the numbers say it should be.
     *
     * Reissue this from the developer price list whenever the list changes.
     */
    psfFrom: 'S$2,370 psf',
    psfRange: '[PSF RANGE — not stated in the source; take it from the price list]',
    priceLastUpdated: '2026-08-22',
    maintenanceEstimate: '[MAINTENANCE FEE ESTIMATE – VERIFY BEFORE PUBLISHING]',
    priceListDocument: '[PRICE LIST FILE]',
    table: [
      {
        unitTypeId: '2br',
        unitType: '2 Bedroom',
        areaSqft: '829 sqft available',
        priceFrom: 'S$2,066,700',
        psf: '[PSF – NOT STATED IN THE SOURCE]',
        availability: 'limited',
      },
      {
        unitTypeId: '2brs',
        unitType: '2 Bedroom + Study',
        areaSqft: '743 sqft available',
        priceFrom: 'S$2,001,000',
        psf: '[PSF – NOT STATED IN THE SOURCE]',
        availability: 'limited',
      },
      {
        unitTypeId: '3br',
        unitType: '3 Bedroom',
        areaSqft: '1,206 – 1,485 sqft available',
        priceFrom: 'S$3,234,900',
        psf: '[PSF – NOT STATED IN THE SOURCE]',
        availability: 'limited',
      },
      {
        unitTypeId: '4br',
        unitType: '4 Bedroom',
        areaSqft: '1,335 – 1,679 sqft',
        priceFrom: '[SOLD OUT AS AT 22 AUGUST 2026]',
        psf: '[PSF – NOT STATED IN THE SOURCE]',
        availability: 'sold-out',
      },
      {
        unitTypeId: '5br',
        unitType: '5 Bedroom',
        areaSqft: '1,550 – 1,841 sqft',
        priceFrom: '[SOLD OUT AS AT 22 AUGUST 2026]',
        psf: '[PSF – NOT STATED IN THE SOURCE]',
        availability: 'sold-out',
      },
    ] as PriceRow[],
  },

  // -- Unit mix ------------------------------------------------------------
  /**
   * Every area below comes from the fact sheet's unit-mix table (Source A) and
   * the layout sheets in the catalogue (Source B), both of which state areas in
   * SQUARE METRES only. The sqft figures are those same square-metre areas
   * converted at 10.7639 and rounded to the nearest foot — no area is invented,
   * and the conversion reproduces the sqft figures the developer's own listing
   * publishes for the available stock (77 sqm → 829 sqft, 69 sqm → 743 sqft,
   * 112 sqm → 1,206 sqft, 138 sqm → 1,485 sqft).
   *
   * Areas include air-conditioner ledges and balcony; RC ledges and voids are
   * excluded from the strata area. That wording is the layout sheets' own.
   *
   * "Typical" is a middle-storey unit; "Upper" is the top-storey unit of the
   * same stack, which carries a larger strata area. Unit counts are the
   * project totals from the fact sheet, not what remains — see `availability`.
   */
  unitTypes: [
    {
      id: '2br',
      name: '2 Bedroom',
      bedrooms: 2,
      category: '2-bedroom',
      hasStudy: false,
      hasFlexRoom: false,
      areaSqft: '700 – 829 sqft',
      areaSqm: '65 – 77 sqm',
      unitCount: '104 units',
      availability: 'limited',
      suitedTo: '[BUYER PROFILE — add your own view]',
      selectionNotes:
        'One layout family, Type B1, on a single sheet: B1 and B1-P at 65 sqm, and the top-storey B1-U at 77 sqm. B1-P is the first-storey unit. The 104 units are 11.3% of the development and only one remained as at 22 August 2026.',
    },
    {
      id: '2brs',
      name: '2 Bedroom + Study',
      bedrooms: 2,
      category: '2-bedroom',
      hasStudy: true,
      hasFlexRoom: false,
      areaSqft: '732 – 883 sqft',
      areaSqm: '68 – 82 sqm',
      unitCount: '299 units',
      availability: 'limited',
      suitedTo: '[BUYER PROFILE — add your own view]',
      selectionNotes:
        'Two layout families. Type B2 runs 68 sqm typical and 81 sqm upper; Type B2a runs 69 sqm typical and 82 sqm upper. B2a is the layout used for the 2 Bedroom show unit. At 299 units this is the single largest type in the development.',
    },
    {
      id: '3br',
      name: '3 Bedroom',
      bedrooms: 3,
      category: '3-bedroom',
      hasStudy: false,
      hasFlexRoom: false,
      areaSqft: '915 – 1,507 sqft',
      areaSqm: '85 – 140 sqm',
      unitCount: '431 units',
      availability: 'limited',
      suitedTo: '[BUYER PROFILE — add your own view]',
      selectionNotes:
        'Three series, and the difference between them is real floor area rather than trim: Classic (C1, C1a, C1b) at 85 – 89 sqm, Deluxe (C2, C2a) at 95 – 96 sqm, and Premium (C3, C3a, C3b) at 112 – 114 sqm. Each has a larger top-storey variant. At 431 units — 47% of the development — this is the type most stacks are built around, and it holds most of the remaining stock.',
    },
    {
      id: '4br',
      name: '4 Bedroom',
      bedrooms: 4,
      category: '4-bedroom',
      hasStudy: false,
      hasFlexRoom: false,
      areaSqft: '1,335 – 1,679 sqft',
      areaSqm: '124 – 156 sqm',
      unitCount: '60 units',
      availability: 'sold-out',
      suitedTo: '[BUYER PROFILE — add your own view]',
      selectionNotes:
        'Two layouts: Type D1 at 124 sqm typical and 150 sqm upper, and Type D2 at 129 sqm typical and 156 sqm upper. D1 sits in blocks 248 and 250, D2 in block 246. Fully sold as at 22 August 2026.',
    },
    {
      id: '5br',
      name: '5 Bedroom',
      bedrooms: 5,
      category: '5-bedroom',
      hasStudy: false,
      hasFlexRoom: false,
      areaSqft: '1,550 – 1,841 sqft',
      areaSqm: '144 – 171 sqm',
      unitCount: '22 units',
      availability: 'sold-out',
      suitedTo: '[BUYER PROFILE — add your own view]',
      selectionNotes:
        'A single layout, Type E1, at 144 sqm typical and 171 sqm upper, on one stack in block 246. Twenty-two units in total — 2.4% of the development — and the layout used for the 5 Bedroom show unit. Fully sold as at 22 August 2026.',
    },
  ] as UnitType[],

  // -- Floorplans ----------------------------------------------------------
  /**
   * The plan sheets rendered into /public/images/floorplans are the unit layout
   * pages of the preview catalogue (Source B), exported at their native
   * resolution and placed on a common 1000 x 1200 canvas so the cards line up.
   * Nothing on them is redrawn or retouched. Republishing them still depends on
   * Huttons' authorisation — see the note at the top of this file.
   */
  floorplans: {
    lastUpdated: '2024-10-02',
  },

  // -- Brochure ------------------------------------------------------------
  /**
   * `file` is deliberately empty. The two documents on hand are agency sales
   * material from October 2024 — one of them a 167-slide internal sales kit —
   * and neither is the current developer e-brochure. The section therefore
   * offers one action: request the current version. Drop an authorised PDF into
   * /public/brochure and set `file` if that changes.
   */
  brochure: {
    file: '',
    /**
     * The real cover: page 1 of the preview catalogue, rendered from the PDF at
     * 900 px wide. Nothing is recomposed. Re-render page 1 after any reissue.
     */
    cover: '/images/brochure/brochure-cover.webp',
    coverWidth: 900,
    coverHeight: 1273,
    coverAlt:
      'Front cover of the Chuan Park preview catalogue: a deep teal panel with a fine vertical line pattern, the gold CHUAN PARK 鑫丰瑞府 wordmark, and the line “Tranquil nature amidst urban convenience”.',
    format: 'PDF',
    fileSize: '22 MB',
    lastUpdated: '2024-10-02',
    summary:
      'the development overview, the Lorong Chuan location and its amenities, the facilities and landscape zones, the site plan, and a layout sheet for every unit type from 2 Bedroom to 5 Bedroom',
    /*
     * The section no longer renders a note under the CTA, so nothing here is
     * shown. Worth remembering anyway: the material on hand is dated October
     * 2024, and price and availability have moved a long way since — send the
     * current version, not this one.
     */
  },

  // -- Location ------------------------------------------------------------
  /**
   * Every item below is sourced from the two 2024 documents. NONE of it is
   * measured. The MRT walk, the expressway drive and the school bands are the
   * marketing documents' own claims, so they are marked `approximate` and the
   * section says so. Verify anything a buyer would act on — school distances
   * especially — on OneMap before you repeat it.
   */
  location: {
    mapImage: '/images/map/location-map.webp',
    mapImageWidth: 1800,
    mapImageHeight: 1455,
    mapImageAlt:
      'Location map marking Chuan Park at Lorong Chuan, with Bishan, Serangoon, Kovan, Woodleigh, Bartley and Braddell MRT stations, the surrounding schools and the landed areas shaded around it',
    interactiveMapUrl: 'https://www.google.com/maps/search/?api=1&query=Lorong+Chuan+Singapore',

    overview: [
      'Chuan Park occupies a 37,215.60 sqm site on Lorong Chuan, bounded by Serangoon Avenue 3, in the Lorong Chuan subzone of the Serangoon planning area — District 19. It sits beside Lorong Chuan MRT and New Tech Park, with landed housing on the other side of the road.',
      'The station is one Circle Line stop from Serangoon in one direction and one stop from Bishan in the other, which puts NEX and Junction 8 — and the North East and North South line interchanges under them — a single stop away in either direction.',
    ],

    strengths: [],
    tradeOffs: [],

    groups: [
      {
        title: 'Getting around',
        items: [
          {
            name: 'Lorong Chuan (Circle Line)',
            distance: '',
            time: '2 min walk',
            quality: 'approximate',
            /*
             * Ethan's own figure, 22 Aug 2026, and it is the one the About copy
             * uses. It does NOT come from the sales kit, which says 5–10
             * minutes — so it is marked approximate and
             * `verification.travelTimeClaims` stays false until it is walked or
             * measured on OneMap.
             */
            // Supplied by Ethan; the 2024 sales kit says 5 – 10 minutes. Not measured.
          },
          {
            name: 'Serangoon (Circle Line / North East Line), NEX',
            distance: '',
            time: '1 stop',
            quality: 'approximate',
          },
          {
            name: 'Bishan (Circle Line / North South Line), Junction 8',
            distance: '',
            time: '1 stop',
            quality: 'approximate',
          },
          {
            name: 'Central Expressway (CTE) and Pan Island Expressway (PIE)',
            distance: '',
            time: '1 – 2 min drive',
            quality: 'approximate',
            // The sales kit also flags heavy peak-hour traffic on both.
          },
        ],
      },
      {
        /**
         * BANDS COME FROM THE SOURCE DOCUMENTS, NOT FROM MEASUREMENT HERE.
         *
         * The five primary schools are from Source A slide 77, "PRIMARY SCHOOLS
         * WITHIN 1KM (ESTIMATED)", which reproduces OneMap "within 1km radius"
         * results BLOCK BY BLOCK against the 2024 Phase 2C balloting outcome.
         * That is why two of them carry a block list: the 1 km boundary cuts
         * through this site, so the answer genuinely differs depending on which
         * block a unit is in.
         *
         * Nanyang Junior College and the Australian International School are
         * read off the 500 m / 1 km ring map on the factsheet (Source A slide
         * 9), where both sit inside the 1 km ring.
         *
         * St Andrew's Junior College and Stamford American International School
         * were previously listed here on the strength of the catalogue calling
         * them "near". Neither appears inside any ring on either map, so they
         * have been dropped rather than given a band that cannot be supported.
         *
         * MOE measures the distance itself, reviews it annually, and priority
         * admission turns on exactly this 1 km boundary. Check any school a
         * parent is counting on, for the specific block, before repeating it.
         */
        title: 'Schools',
        items: [
          {
            name: 'St Gabriel’s Primary School',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
            // Within 1 km of all five blocks — 242, 244, 246, 248 and 250.
          },
          {
            name: 'Yangzheng Primary School',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
            // Within 1 km of all five blocks — 242, 244, 246, 248 and 250.
          },
          {
            name: 'CHIJ Our Lady of Good Counsel',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
            // Within 1 km of all five blocks — 242, 244, 246, 248 and 250.
          },
          {
            name: 'Zhonghua Primary School',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
            // Blocks 244, 246, 248 and 250 only — NOT block 242. Stated in the
            // section disclaimer, which is where the block caveats now live.
          },
          {
            name: 'Kuo Chuan Presbyterian Primary School',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
            // Blocks 242, 244 and 250 only — see the section disclaimer.
          },
          {
            name: 'Nanyang Junior College',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
          },
          {
            name: 'Australian International School',
            distance: '',
            time: '',
            quality: 'approximate',
            band: 'within-1km',
          },
        ],
      },
      {
        /**
         * Distances here are read off the 500 m / 1 km ring map on the
         * factsheet (Source A slide 9) and the supermarket panel on slide 69,
         * which lists FairPrice, Cold Storage and Giant as "Within 1km". They
         * are bands, not measurements — "approx." is doing real work in each
         * one, and none of them is precise enough to plan a walk around.
         */
        title: 'Everyday amenities',
        items: [
          {
            name: 'New Tech Park (NTP+)',
            distance: 'Adjacent to the site',
            time: '',
            quality: 'approximate',
          },
          {
            name: 'FairPrice, Cold Storage and Giant supermarkets',
            distance: 'Within approx. 1 km',
            time: '',
            quality: 'approximate',
          },
          {
            name: 'NEX, Serangoon — integrated with the MRT and bus interchange',
            distance: '',
            time: 'One MRT stop',
            quality: 'approximate',
            // The catalogue puts NEX at over 340 stores.
          },
          {
            name: 'Junction 8, Bishan',
            distance: '',
            time: 'One MRT stop',
            quality: 'approximate',
            // The catalogue puts Junction 8 at roughly 174 stores.
          },
          {
            name: 'Chomp Chomp Food Centre and Serangoon Garden Market',
            distance: 'Beyond approx. 1 km',
            time: '',
            quality: 'approximate',
            // Outside the 1 km ring on the marketing map; not measured.
          },
        ],
      },
    ] as AmenityGroup[],

    futureInfrastructure: [
      'URA’s plans for the Lorong Chuan precinct include new parks, amenities and pedestrian and cycling links serving the wider Lorong Chuan community.',
      'The relocation of Paya Lebar Air Base, and the redevelopment of that land, sits to the east on a horizon of decades. These are long-term plans rather than commitments: scope and timing have been revised before, and nothing on this page should be read as a forecast of what they will do to prices.',
    ],
  },

  // -- Media ---------------------------------------------------------------
  media: {
    /**
     * The project wordmark as it appears on the sales-kit slide masters, lifted
     * at 8x render scale and keyed to transparency so it sits on the page
     * background rather than on a cream tile. It is the artwork itself, not a
     * trace or a retype.
     */
    logo: '/images/project-logo.png',
    logoWidth: 600,
    logoHeight: 168,
    logoAlt: 'Chuan Park',
    /**
     * Same artwork, recoloured to the paper tone for the dark footer — the ink
     * version is near-invisible there. Leave empty and the footer falls back to
     * `logo`, which is right for a lockup that already reads on dark.
     */
    logoLight: '/images/project-logo-light.png',

    /** The LCP element: loaded eagerly at high priority, and never animated. */
    /*
     * The establishing view, deliberately: both towers, the lagoon pool and the
     * landscaped deck in one frame, so a visitor arriving from an ad can see
     * what the development IS before reading a word. The detail shots — cabanas,
     * lap pool, clubhouse — are lovely but generic, and could be any condominium
     * in Singapore. They sit in the gallery, which is where they belong.
     */
    heroImage: '/images/hero/towers-dusk.webp',
    heroImageMobile: '/images/hero/towers-dusk-mobile.webp',
    heroImageWidth: 1554,
    heroImageHeight: 874,
    heroImageMobileWidth: 745,
    heroImageMobileHeight: 931,
    heroImageAlt:
      'Artist’s impression of Chuan Park at dusk: the two residential towers lit from within, rising above the free-form lagoon pool and its landscaped deck, against a sunset sky',

    /**
     * Optional figure beside the Location copy. Empty on purpose — the section
     * leads with the location map, which carries far more for a buyer than a
     * second picture above it. Point this at an image and the figure returns,
     * with the section switching back to two columns on wide screens.
     *
     * The vicinity photograph that was here, `gallery/10-vicinity.webp`, is
     * left in place but is no longer referenced anywhere — set this back to it
     * to restore the figure.
     */
    locationImage: '',
    locationImageWidth: 1585,
    locationImageHeight: 945,
    locationImageAlt:
      'Aerial photograph looking out over the landed housing estate around Lorong Chuan, with the low-rise roofs of the neighbourhood in the foreground and the wider central region beyond',
    /** Overrides the default "Artist's impression" caption — this one is a photograph. */
    locationImageCaption: 'Photograph of the surrounding estate, from the sales kit',

    /** Shown in the About section. Deliberately a different render from the hero. */
    aboutImage: '/images/gallery/11-facilities.webp',
    aboutImageWidth: 1285,
    aboutImageHeight: 653,
    aboutImageAlt:
      'Artist’s impression of the facilities deck at Chuan Park, with the pool threading between planted terraces and the glazed clubhouse pavilion set among the blocks',

    sitePlan: '/images/site-plan.webp',
    sitePlanWidth: 1946,
    sitePlanHeight: 950,
    sitePlanAlt:
      'Chuan Park site plan: the triangular site between Lorong Chuan and Serangoon Avenue 3, showing the five residential blocks set around the central water body and the landscaped facilities between them',

    ogImage: '/images/og-chuan-park.png',

    /**
     * The Kingsford Development mark, cropped from the developer page of the
     * preview catalogue with a real alpha channel rather than a cream tile.
     */
    developerLogo: '/images/developer/kingsford-logo.webp',
    developerLogoWidth: 800,
    developerLogoHeight: 197,
    developerLogoAlt: 'Logo of Kingsford Development',

    gallery: [
      {
        src: '/images/gallery/01-arrival.webp',
        width: 1584,
        height: 950,
        alt: 'Artist’s impression of the arrival courtyard at Chuan Park: a glazed, timber-lined drop-off pavilion set beneath the tower, with planting along the driveway',
        caption: 'Arrival courtyard',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/02-lap-pool.webp',
        width: 1554,
        height: 947,
        alt: 'Artist’s impression of the 50-metre lap pool at Chuan Park, running the length of the site between planted terraces with the residential blocks either side',
        caption: '50 m lap pool',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/03-waterfront-pool.webp',
        width: 1567,
        height: 946,
        alt: 'Artist’s impression of the poolside deck at Chuan Park, with sun loungers along the water’s edge and a residential block rising directly behind the planting',
        caption: 'Poolside deck',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/04-poolside-cabanas.webp',
        width: 1554,
        height: 951,
        alt: 'Artist’s impression of the cabanas at Chuan Park at dusk: tall palms above a row of daybeds set along the pool, lit from below',
        caption: 'Cabanas at dusk',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/05-living-interior.webp',
        width: 1600,
        height: 686,
        alt: 'Artist’s impression of a bedroom interior at Chuan Park, looking through a full-height opening onto a timber deck and the pool and planting beyond',
        caption: 'Interior outlook',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/06-clubhouse.webp',
        width: 1600,
        height: 802,
        alt: 'Artist’s impression of the clubhouse at Chuan Park: a curved glazed pavilion at the pool edge, with the free-form pool and the blocks behind it',
        caption: 'Clubhouse',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/07-tower.webp',
        width: 1564,
        height: 947,
        alt: 'Artist’s impression of a Chuan Park tower seen from the ground looking up, showing the stacked balconies and the tree canopy at its base',
        caption: 'Tower elevation',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/08-dusk-lagoon.webp',
        width: 1235,
        height: 635,
        alt: 'Artist’s impression of Chuan Park at dusk from across the water, with lit blocks reflected in the pool and mature palms along the deck',
        caption: 'Waterside at dusk',
        isArtistImpression: true,
      },
      {
        src: '/images/gallery/09-bedroom.webp',
        width: 1054,
        height: 546,
        alt: 'Artist’s impression of a bedroom at Chuan Park, with a bed against a timber-panelled wall and the balcony and pool view beyond the glazing',
        caption: 'Bedroom',
        isArtistImpression: true,
      },
      /*
       * The site plan sits in the gallery because this template has no site-plan
       * section of its own, and a plan of the grounds is more use to a buyer
       * than a tenth render. No artist's-impression badge — it is a plan.
       */
      {
        src: '/images/site-plan.webp',
        width: 1946,
        height: 950,
        alt: 'Chuan Park site plan: the triangular site between Lorong Chuan and Serangoon Avenue 3, showing the five residential blocks set around the central water body and the landscaped facilities between them',
        caption: 'Site plan',
        isArtistImpression: false,
      },
    ] as GalleryImage[],
  },

  // -- Content -------------------------------------------------------------
  content: {
    heroHeadline: 'Chuan Park',
    heroSubheadline: '',
    heroSupporting: '',

    overview: [
      'Chuan Park is located along Lorong Chuan in District 19 — a 99-year leasehold, brand-new condominium by established developer Kingsford.',
      'Chuan Park is only a 2-minute walk to Lorong Chuan MRT on the Circle Line. This mega development of 916 units offers 2- to 5-bedroom unit types with efficient layouts and modern design. Prices start from S$2,001,000, subject to availability.',
    ],

    /*
     * Empty on purpose, so the "Points worth weighing before you commit" block
     * does not render. The material that was here — what the -P/-m/-U suffixes
     * mean for usable area, what the quoted areas include, the orientation
     * split, and how thin the remaining stock is — is all still recorded in
     * `unitTypes[].selectionNotes` and in the FAQ. Add strings here and the
     * block returns.
     */
    buyerConsiderations: [],

    pricingAnalysis: [
      'What is on the table has narrowed sharply. The Huttons unit chart showed 891 of 918 units taken up as at 22 August 2026, leaving 27: one 2 Bedroom, four 2 Bedroom + Study, twenty-one 3 Bedroom and one shop. The 4 and 5 Bedroom types are gone.',
      'That is why the "from" prices below do not run in size order. They are floor prices for what remains, not for the type as launched — the last 2 Bedroom is an 829 sqft upper-storey unit at S$2,066,700, while the remaining 2 Bedroom + Study units are 743 sqft from S$2,001,000.',
      '[PRICING COMMENTARY — add your own view: how the remaining stock prices against recent transactions in the Serangoon planning area and District 19, and against the nearby alternatives. Cite the source and the month of any transaction data. Do not forecast prices or promise appreciation.]',
    ],

    unitSelectionAnalysis: [
      'Three suffixes do most of the work in the layout codes. "-P" is the first-storey unit of a stack; the plain code, shown as "-m" on the diagrammatic chart, is a typical middle-storey unit; "-U" is the top-storey unit, which carries a materially larger strata area — a Type B1 goes from 65 sqm to 77 sqm at the top, and a Type C3 from 112 sqm to 138 sqm. Compare enclosed floor area, not the headline figure.',
      'On orientation, the sales kit puts 41% of units north-facing and 41% south-facing, with 10% north-west and 8% south-east; and 70% facing outward to the garden and city, 30% inward to the garden and pool. Which of those you want depends on afternoon sun, on what is likely to be built out, and on whether you would rather look at the estate or at the development — worth settling before you shortlist a stack.',
      '[ADD YOUR OWN VIEW — which of the remaining stacks you would put a buyer in and why, and where the level premium stops being worth paying.]',
    ],

    marketComparison: [
      '[MARKET COMPARISON — set out the new launch and resale alternatives in District 19 and the adjacent planning areas, with the trade-offs of each on quantum, tenure, size and connectivity. Cite the source and date of any transaction data. Do not forecast prices or promise appreciation.]',
    ],

    /**
     * Drawn from the developer profile page of the preview catalogue (Source B).
     * The awards paragraph on that page is deliberately left out — this template
     * does not carry award claims it cannot independently evidence.
     */
    developerProfile: [
      'Chuan Park is developed by Chuan Park Development Pte Ltd, developer’s licence C1491, a project company of Kingsford Development. The main contractor is China Construction (South Pacific) Development Co Pte Ltd and the architect is AGA Architects Pte Ltd.',
      'Kingsford Development was established in Singapore in 2011 to engage in property development. Its completed Singapore projects include the 512-unit Kingsford Hillview Peak at Hillview Avenue, the 1,165-unit Kingsford Waterbay at Upper Serangoon View and the 1,862-unit Normanton Park.',
    ],
  },

  /**
   * UNIT AVAILABILITY
   * -------------------------------------------------------------------------
   * From the Huttons agent portal unit chart, 22 August 2026 (Source D), which
   * publishes a sold / available split per TYPE and not per layout. Every
   * per-layout `unitsLeft` in an available category is therefore `null` — shown
   * as "On request", never as a number. Where a category total is 0 the layouts
   * under it are necessarily 0, which is the one inference made here.
   *
   * THIS GOES STALE FASTER THAN ANYTHING ELSE ON THE PAGE — twenty-seven units
   * remained on the date above. Update `asAt` every time you refresh it, and
   * re-check against the live chart before quoting any of it to a buyer.
   */
  availability: {
    asAt: '2026-08-22',
    source: 'Huttons agent portal unit chart, 22 August 2026',
    /** One of the two shop units remained; commercial, not a residential type. */
    shopsLeft: 1 as number | null,
    /**
     * Whether the retail unit is offered on this page at all. It is `false`
     * because the page is marketing homes — not because the shop is gone.
     * `shopsLeft` above stays truthful and is what any future retail page
     * should read. Setting this true restores the Retail shop row in the Price
     * table and the "Shop" option in the enquiry form together, so the two can
     * never disagree.
     */
    listRetail: false,
    categories: [
      {
        id: '2br',
        name: '2 Bedroom',
        category: '2-bedroom',
        unitsLeft: 1,
        layouts: [
          {
            code: 'B1-U',
            sqft: 829,
            sqm: 77,
            unitsLeft: null,
            image: '/images/floorplans/b1-2br.webp',
          },
          {
            code: 'B1',
            sqft: 700,
            sqm: 65,
            unitsLeft: null,
            image: '/images/floorplans/b1-2br.webp',
          },
          {
            code: 'B1-P',
            sqft: 700,
            sqm: 65,
            unitsLeft: null,
            image: '/images/floorplans/b1-2br.webp',
          },
        ],
      },
      {
        id: '2brs',
        name: '2 Bedroom + Study',
        category: '2-bedroom',
        unitsLeft: 4,
        layouts: [
          {
            code: 'B2a-U',
            sqft: 883,
            sqm: 82,
            unitsLeft: null,
            image: '/images/floorplans/b2a-2br-study.webp',
          },
          {
            code: 'B2-U',
            sqft: 872,
            sqm: 81,
            unitsLeft: null,
            image: '/images/floorplans/b2-2br-study.webp',
          },
          {
            code: 'B2a',
            sqft: 743,
            sqm: 69,
            unitsLeft: null,
            image: '/images/floorplans/b2a-2br-study.webp',
          },
          {
            code: 'B2a-P',
            sqft: 743,
            sqm: 69,
            unitsLeft: null,
            image: '/images/floorplans/b2a-2br-study.webp',
          },
          {
            code: 'B2',
            sqft: 732,
            sqm: 68,
            unitsLeft: null,
            image: '/images/floorplans/b2-2br-study.webp',
          },
          {
            code: 'B2-P',
            sqft: 732,
            sqm: 68,
            unitsLeft: null,
            image: '/images/floorplans/b2-2br-study.webp',
          },
        ],
      },
      {
        id: '3br',
        name: '3 Bedroom',
        category: '3-bedroom',
        unitsLeft: 21,
        layouts: [
          {
            code: 'C3b-U (Premium)',
            sqft: 1507,
            sqm: 140,
            unitsLeft: null,
            image: '/images/floorplans/c3b-3br-premium.webp',
          },
          {
            code: 'C3a-U (Premium)',
            sqft: 1496,
            sqm: 139,
            unitsLeft: null,
            image: '/images/floorplans/c3a-3br-premium.webp',
          },
          {
            code: 'C3-U (Premium)',
            sqft: 1485,
            sqm: 138,
            unitsLeft: null,
            image: '/images/floorplans/c3-3br-premium.webp',
          },
          {
            code: 'C3b (Premium)',
            sqft: 1227,
            sqm: 114,
            unitsLeft: null,
            image: '/images/floorplans/c3b-3br-premium.webp',
          },
          {
            code: 'C3 (Premium)',
            sqft: 1206,
            sqm: 112,
            unitsLeft: null,
            image: '/images/floorplans/c3-3br-premium.webp',
          },
          {
            code: 'C3a (Premium)',
            sqft: 1206,
            sqm: 112,
            unitsLeft: null,
            image: '/images/floorplans/c3a-3br-premium.webp',
          },
          {
            code: 'C2-U (Deluxe)',
            sqft: 1206,
            sqm: 112,
            unitsLeft: null,
            image: '/images/floorplans/c2-3br-deluxe.webp',
          },
          {
            code: 'C1a-U (Classic)',
            sqft: 1119,
            sqm: 104,
            unitsLeft: null,
            image: '/images/floorplans/c1a-3br-classic.webp',
          },
          {
            code: 'C1-U (Classic)',
            sqft: 1109,
            sqm: 103,
            unitsLeft: null,
            image: '/images/floorplans/c1-3br-classic.webp',
          },
          {
            code: 'C2a (Deluxe)',
            sqft: 1033,
            sqm: 96,
            unitsLeft: null,
            image: '/images/floorplans/c2a-3br-deluxe.webp',
          },
          {
            code: 'C2 (Deluxe)',
            sqft: 1023,
            sqm: 95,
            unitsLeft: null,
            image: '/images/floorplans/c2-3br-deluxe.webp',
          },
          {
            code: 'C1b (Classic)',
            sqft: 958,
            sqm: 89,
            unitsLeft: null,
            image: '/images/floorplans/c1b-3br-classic.webp',
          },
          {
            code: 'C1a (Classic)',
            sqft: 936,
            sqm: 87,
            unitsLeft: null,
            image: '/images/floorplans/c1a-3br-classic.webp',
          },
          {
            code: 'C1 (Classic)',
            sqft: 915,
            sqm: 85,
            unitsLeft: null,
            image: '/images/floorplans/c1-3br-classic.webp',
          },
        ],
      },
      {
        id: '4br',
        name: '4 Bedroom',
        category: '4-bedroom',
        unitsLeft: 0,
        layouts: [
          {
            code: 'D2-U',
            sqft: 1679,
            sqm: 156,
            unitsLeft: 0,
            image: '/images/floorplans/d2-4br.webp',
          },
          {
            code: 'D1-U',
            sqft: 1615,
            sqm: 150,
            unitsLeft: 0,
            image: '/images/floorplans/d1-4br.webp',
          },
          {
            code: 'D2',
            sqft: 1389,
            sqm: 129,
            unitsLeft: 0,
            image: '/images/floorplans/d2-4br.webp',
          },
          {
            code: 'D1',
            sqft: 1335,
            sqm: 124,
            unitsLeft: 0,
            image: '/images/floorplans/d1-4br.webp',
          },
        ],
      },
      {
        id: '5br',
        name: '5 Bedroom',
        category: '5-bedroom',
        unitsLeft: 0,
        layouts: [
          {
            code: 'E1-U',
            sqft: 1841,
            sqm: 171,
            unitsLeft: 0,
            image: '/images/floorplans/e1-5br.webp',
          },
          {
            code: 'E1',
            sqft: 1550,
            sqm: 144,
            unitsLeft: 0,
            image: '/images/floorplans/e1-5br.webp',
          },
        ],
      },
    ] as AvailabilityCategory[],
  },

  // -- FAQ -----------------------------------------------------------------
  /**
   * Written in the register of the developer's own sale material: what the
   * development is, what it costs, and which document confirms it. Where a fact
   * came from an agency portal, the answer points at the authority behind it —
   * the developer-issued price list, the developer's unit chart, the Sale and
   * Purchase Agreement — rather than naming the intermediary, which tells a
   * buyer nothing and dates badly.
   *
   * That is a change of register, not of substance. Every figure is still the
   * one in `pricing` and `availability`, still carries the date it was taken,
   * and the internal provenance stays recorded on those fields and in the
   * source list at the top of this file.
   */
  faq: [
    {
      question: 'What is the indicative price of [PROJECT NAME]?',
      answer:
        'Prices start from S$2,001,000 for a 743 sqft 2 Bedroom + Study, and from S$2,370 psf. As at 22 August 2026 the one remaining 2 Bedroom, an 829 sqft top-storey unit, was priced from S$2,066,700, and the remaining 3 Bedroom units of 1,206 to 1,485 sqft from S$3,234,900. Prices are indicative, apply only to the units still available, and are revised between sales phases. The developer-issued price list is the only confirmation, and is sent on request.',
      includeInStructuredData: true,
    },
    {
      question: 'How many units are still available?',
      answer:
        'Twenty-seven of the 918 units remained as at 22 August 2026: one 2 Bedroom, four 2 Bedroom + Study, twenty-one 3 Bedroom and one shop unit. The 4 and 5 Bedroom collections are fully sold. Availability moves continuously and is confirmed only against the developer’s current unit chart at the point of booking.',
      includeInStructuredData: true,
    },
    {
      question: 'Where is [PROJECT NAME] located?',
      answer:
        '[PROJECT NAME] is on [STREET ADDRESS], in the Lorong Chuan subzone of the Serangoon planning area, [DISTRICT]. The site adjoins Lorong Chuan MRT on the Circle Line and New Tech Park, one stop from Serangoon in one direction and one from Bishan in the other. The Location section sets out the schools, malls and expressway access in the vicinity.',
      includeInStructuredData: true,
    },
    {
      question: 'Where is the showflat and can I view it?',
      answer:
        'Viewing is by appointment. The showflat address is confirmed at the time of booking, and viewing hours can change at short notice, so please arrange a slot before travelling.',
      includeInStructuredData: true,
    },
    {
      question: 'What unit types are available?',
      answer:
        'The development comprises 916 residential units and two shop units: 2 Bedroom (104 units), 2 Bedroom + Study (299), 3 Bedroom across the Classic, Deluxe and Premium series (431), 4 Bedroom (60) and 5 Bedroom (22). As at 22 August 2026 only the 2 Bedroom, 2 Bedroom + Study and 3 Bedroom types remained available.',
      includeInStructuredData: true,
    },
    {
      question: 'How big are the units?',
      answer:
        'Areas run from 65 sqm, about 700 sqft, for a 2 Bedroom, to 171 sqm, about 1,841 sqft, for a top-storey 5 Bedroom. Quoted areas are strata areas: they include the balcony and the air-conditioner ledges, while RC ledges and voids are excluded. A top-storey unit carries a larger strata area than the typical unit in the same stack, so compare enclosed floor area rather than the headline figure.',
      includeInStructuredData: true,
    },
    {
      question: 'What is the tenure and when is completion expected?',
      answer:
        'The tenure is 99 years. The expected date of Temporary Occupation Permit is Q4 2027. The estimated date of vacant possession is 31 December 2028 and the estimated date of legal completion is 31 December 2031; these are the dates set out in the sale documents and they are the ones that bind. Confirm them, together with the lease commencement date, in the Sale and Purchase Agreement.',
      includeInStructuredData: true,
    },
  ] as FaqItem[],

  // -- Contact / conversions ----------------------------------------------
  contact: {
    whatsappMessage: 'Hi Ethan, I saw the [PROJECT NAME] website and would like more information.',
    whatsappMessages: {
      general: 'Hi Ethan, I saw the [PROJECT NAME] website and would like more information.',
      priceList: 'Hi Ethan, may I have the latest price list for [PROJECT NAME]?',
      floorplans: 'Hi Ethan, may I have the full floorplan collection for [PROJECT NAME]?',
      brochure: 'Hi Ethan, may I have the latest brochure for [PROJECT NAME]?',
      showflat: 'Hi Ethan, I would like to arrange a showflat appointment for [PROJECT NAME].',
    },
    formRecipientNote: 'Configured via LEAD_DELIVERY_MODE in the environment.',
    responseExpectation:
      'Enquiries are usually answered within a few hours during the day. If a reply is urgent, WhatsApp is fastest.',
  },

  // -- Pre-publication verification ----------------------------------------
  /**
   * Flags set to `true` were checked against the sources named at the top of
   * this file. Everything still `false` either is not stated in those sources,
   * or is a representation only you can make. Re-check the `true` ones yourself
   * before publishing — they are your representations, not the document's.
   */
  verification: {
    projectName: true, // Source A fact sheet
    developer: true, // Source A: Chuan Park Development Pte Ltd, licence C1491
    location: true, // Source A: Lorong Chuan, Lorong Chuan subzone; Source C: District 19
    tenure: true, // Source A / Source C: 99 years
    unitCount: true, // Source A: 916 residential units + 2 shop units
    previewDate: false, // not stated in either source
    bookingDate: false,
    expectedTop: false, // Source A gives vacant possession; Source C says Q4 2027 — they disagree
    prices: true, // Source C, dated in pricing.priceLastUpdated
    availability: true, // Source D, dated in availability.asAt
    floorplans: true, // Source B layout sheets; Source A unit-mix table
    projectImages: false,
    distanceClaims: false, // the documents' own claims, not measured
    travelTimeClaims: false,
    schoolInformation: false, // school names only; 1 km bands stated by the documents, not verified
    agencyAppointmentStatus: false,
    developerAppointmentStatus: false,
    permissionToUseLogos: false,
    permissionToUseBrochure: false,
    permissionToUseImages: false,
    agentCeaDetails: true, // CEA reg R064895H and Huttons licence L3008899K both confirmed by Ethan
  },
};

export type Project = typeof project;

/** Unit-type categories that actually exist on this project (for filters). */
export function activeCategories(): UnitType['category'][] {
  const present = new Set<UnitType['category']>();
  for (const cat of project.availability.categories) present.add(cat.category);
  return Array.from(present);
}

/** Quick facts for the About section — placeholders are dropped, not faked. */
export function quickFacts(): Fact[] {
  const candidates: Fact[] = [
    { label: 'Developer', value: project.developer },
    { label: 'Address', value: project.streetAddress },
    { label: 'District', value: project.district },
    { label: 'Tenure', value: project.tenure },
    { label: 'Total units', value: project.totalUnits },
    { label: 'Expected TOP', value: project.expectedTop },
    { label: 'Nearest MRT', value: project.location.groups[0]?.items[0]?.name ?? '' },
    { label: 'Project status', value: project.projectStatus },
  ];
  return candidates.filter((f) => !isPlaceholder(f.value));
}
