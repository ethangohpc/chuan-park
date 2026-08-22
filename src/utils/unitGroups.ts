/**
 * UNIT-TYPE CONSOLIDATION
 * ===========================================================================
 * The developer's mix runs to fifteen named types — 1 Bedroom, 1 Bedroom +
 * Study, 2 Bedroom Dual Key, 3 Bedroom Flex, and so on, each in a Luxury or
 * Grand collection. That is the right level of detail for a price list and the
 * wrong level for a landing page: a buyer scanning for "is there a three-
 * bedder left?" should not have to read five rows to answer it.
 *
 * So the page groups them into the six headline sizes. Nothing is discarded:
 * each group carries the names of the types inside it, the full area range
 * across them, and the sum of units remaining, so the consolidated view and
 * the developer's own chart agree.
 *
 * Both the Price table and the Floorplans carousel read from here, which is
 * what stops the two sections from ever disagreeing.
 */
import { project, type AvailabilityCategory } from '../data/project';

export const GROUP_ORDER = [
  '1-bedroom',
  '2-bedroom',
  '3-bedroom',
  '4-bedroom',
  '5-bedroom',
  'penthouse',
] as const;

export type GroupKey = (typeof GROUP_ORDER)[number];

export const GROUP_LABEL: Record<GroupKey, string> = {
  '1-bedroom': '1 Bedroom',
  '2-bedroom': '2 Bedroom',
  '3-bedroom': '3 Bedroom',
  '4-bedroom': '4 Bedroom',
  '5-bedroom': '5 Bedroom',
  penthouse: 'Penthouse',
};

export interface UnitGroup {
  key: GroupKey;
  name: string;
  /** The developer's own type names inside this group, in source order. */
  includes: string[];
  minSqft: number;
  maxSqft: number;
  /** Total layouts across the group — the developer's sheet count. */
  layoutCount: number;
  /**
   * Units remaining across the group. `null` only when every type in the group
   * is itself unknown — a known zero and an unknown are not the same thing, and
   * summing them as if they were would invent a fact.
   */
  unitsLeft: number | null;
  /**
   * De-duplicated floorplan sheets for every type in the group, each labelled
   * with the developer's own layout codes that share it. One sheet often covers
   * a family — a type and its upper-storey and first-storey siblings — so the
   * label is the set of base codes on that sheet, e.g. "C3a".
   */
  sheets: Sheet[];
}

export interface Sheet {
  image: string;
  /** The developer's base layout code(s) on this sheet, e.g. 'B2a' or 'C1'. */
  label: string;
}

/**
 * Strips the storey suffix and the series note from a layout code, so the
 * variants that share one sheet collapse to a single label:
 * 'C3b-U (Premium)' -> 'C3b', 'B1-P' -> 'B1'.
 */
function baseCode(code: string): string {
  return code
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/-(U|P)$/i, '')
    .trim();
}

export function unitGroups(): UnitGroup[] {
  const categories = project.availability.categories;

  return GROUP_ORDER.map((key) => {
    const members = categories.filter((c) => c.category === key);
    if (!members.length) return null;

    const areas = members.flatMap((m) => m.layouts.map((l) => l.sqft));
    const known = members.map((m) => m.unitsLeft).filter((n): n is number => n !== null);

    return {
      key,
      name: GROUP_LABEL[key],
      includes: members.map((m) => m.name),
      minSqft: Math.min(...areas),
      maxSqft: Math.max(...areas),
      layoutCount: members.reduce((sum, m) => sum + m.layouts.length, 0),
      unitsLeft: known.length ? known.reduce((sum, n) => sum + n, 0) : null,
      sheets: sheetsFor(members),
    } satisfies UnitGroup;
  }).filter((g): g is UnitGroup => g !== null);
}

/**
 * One entry per distinct sheet, in the order the layouts are listed, carrying
 * every base code that points at it. Without this the page can only ever link
 * the first sheet in a group, which on a project with eight 3 Bedroom sheets
 * leaves seven of them unreachable.
 */
function sheetsFor(members: AvailabilityCategory[]): Sheet[] {
  const byImage = new Map<string, Set<string>>();
  for (const m of members) {
    for (const l of m.layouts) {
      if (!l.image) continue;
      const codes = byImage.get(l.image) ?? new Set<string>();
      codes.add(baseCode(l.code));
      byImage.set(l.image, codes);
    }
  }
  return (
    [...byImage]
      .map(([image, codes]) => ({ image, label: [...codes].sort().join(' / ') }))
      // Alphabetical by code, so a card reads C1, C1a, C1b, C2 … rather than in
      // whatever order the availability list happens to be written.
      .sort((a, b) => a.label.localeCompare(b.label, 'en'))
  );
}

/** Formats a group's area span: "452 – 710 sqft", or a single figure. */
export function areaRange(group: UnitGroup): string {
  const min = group.minSqft.toLocaleString();
  const max = group.maxSqft.toLocaleString();
  return group.minSqft === group.maxSqft ? `${min} sqft` : `${min} – ${max} sqft`;
}
