import { TeamMemberSchema, type TeamMember } from './types';

/**
 * PLACEHOLDER ROSTER — replace with the real crew once the Google Drive
 * "pictures and video" folder is accessible (names, roles, bios, and photo
 * keys like "team/first-last"). The About page renders whatever is here,
 * and isPlaceholder entries get a visible "photo coming soon" treatment
 * plus a build-time console warning.
 */
const raw: TeamMember[] = [
  {
    // TODO(Terrell): confirm display name/last name and personalize the bio.
    slug: 'owner',
    name: 'Terrell',
    role: 'Owner',
    bio: 'Terrell leads Southern Roofing & Exteriors from our Dalton shop and stays personally involved in projects across Northwest Georgia and the Chattanooga area — from the first inspection to the final walkthrough.',
    certifications: [],
    photo: 'team/owner',
    isPlaceholder: false,
  },
  {
    slug: 'project-manager',
    name: 'Team Member',
    role: 'Project Manager',
    bio: 'Placeholder — the person who walks customers through inspections, insurance paperwork, and scheduling from first call to final walkthrough.',
    certifications: [],
    photo: null,
    isPlaceholder: true,
  },
  {
    slug: 'crew-lead',
    name: 'Team Member',
    role: 'Crew Lead',
    bio: 'Placeholder — the crew lead your customers will actually see on the roof. Add tenure, specialty (steep-slope, metal, flat), and a personal note.',
    certifications: [],
    photo: null,
    isPlaceholder: true,
  },
];

export const team: TeamMember[] = raw.map((m) => TeamMemberSchema.parse(m));

if (team.some((m) => m.isPlaceholder)) {
  console.warn('[data/team] Placeholder team members present — replace before launch (see README handoff checklist).');
}
