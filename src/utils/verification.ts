/**
 * PRE-PUBLICATION VERIFICATION REPORT
 * ===========================================================================
 * Called once during the build. It prints — to the build log only — a list of
 * facts that have not yet been ticked off in `project.verification`, plus any
 * agent details still holding a placeholder.
 *
 * It never blocks the build and never renders anything to visitors. Its job is
 * to make it hard to publish a page with unverified prices, distances or an
 * unstated CEA registration number.
 */

import { agent, isPlaceholder as agentPlaceholder } from '../data/agent';
import { project } from '../data/project';

const HUMAN: Record<string, string> = {
  projectName: 'Project name',
  developer: 'Developer',
  location: 'Location / address',
  tenure: 'Tenure',
  unitCount: 'Unit count',
  previewDate: 'Preview date',
  bookingDate: 'Booking date',
  expectedTop: 'Expected TOP',
  prices: 'Prices',
  availability: 'Unit availability',
  floorplans: 'Floorplans',
  projectImages: 'Project images',
  distanceClaims: 'Distance claims',
  travelTimeClaims: 'Travel-time claims',
  schoolInformation: 'School information',
  agencyAppointmentStatus: 'Agency appointment status',
  developerAppointmentStatus: 'Developer appointment status',
  permissionToUseLogos: 'Permission to use logos',
  permissionToUseBrochure: 'Permission to use the brochure',
  permissionToUseImages: 'Permission to use project images',
  agentCeaDetails: 'Agent CEA registration and agency licence',
};

export function verificationReport(): { outstanding: string[]; agentGaps: string[] } {
  const outstanding = Object.entries(project.verification)
    .filter(([, checked]) => checked !== true)
    .map(([key]) => HUMAN[key] ?? key);

  const agentGaps: string[] = [];
  if (agentPlaceholder(agent.ceaRegistrationNumber)) agentGaps.push('CEA registration number');
  if (agentPlaceholder(agent.agencyLicenceNumber)) agentGaps.push('Estate agency licence number');
  if (agentPlaceholder(agent.mobileE164)) agentGaps.push('Mobile number');
  if (agentPlaceholder(agent.whatsappE164)) agentGaps.push('WhatsApp number');
  if (agentPlaceholder(agent.email)) agentGaps.push('Email address');

  return { outstanding, agentGaps };
}

let alreadyLogged = false;

/** Prints the report once per build / dev-server start. */
export function logVerificationReport(): void {
  if (alreadyLogged) return;
  alreadyLogged = true;

  const { outstanding, agentGaps } = verificationReport();
  if (!outstanding.length && !agentGaps.length) return;

  const lines: string[] = [
    '',
    '──────────────────────────────────────────────────────────────',
    ' PRE-PUBLICATION CHECK — items still unverified',
    '──────────────────────────────────────────────────────────────',
  ];

  if (agentGaps.length) {
    lines.push(' Required for a compliant property advertisement:');
    for (const gap of agentGaps) lines.push(`   • ${gap} is still a placeholder`);
    lines.push('');
  }

  if (outstanding.length) {
    lines.push(' Not yet ticked off in project.verification:');
    for (const item of outstanding) lines.push(`   • ${item}`);
    lines.push('');
  }

  lines.push(' Verify each item against an authorised source, then set the');
  lines.push(' corresponding flag in src/data/project.ts to true.');
  lines.push('──────────────────────────────────────────────────────────────');
  lines.push('');

  console.warn(lines.join('\n'));
}
