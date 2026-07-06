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
    slug: 'owner',
    name: 'Your Name Here',
    role: 'Owner',
    bio: 'Placeholder — swap in the owner’s real bio: how the company started, ties to Dalton and Northwest Georgia, and what they still do on jobs today.',
    certifications: [],
    photo: null,
    isPlaceholder: true,
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
