import { ServiceSchema, type Service } from './types';

/**
 * The six core services. Every entry is parsed through ServiceSchema at
 * import time, so a bad field fails the build instead of shipping.
 */
const raw: Service[] = [
  {
    slug: 'residential-roofing',
    name: 'Residential Roofing',
    shortName: 'Residential Roofing',
    menuOrder: 1,
    audience: 'residential',
    heroImage: 'services/residential-roofing',
    icon: 'roof',
    schemaServiceType: 'Roof Replacement',
    metaDescription:
      'Roof replacement and new roofs in Dalton, GA and Northwest Georgia. Locally owned, licensed and insured. Start with a free, no-obligation inspection.',
    summary:
      'Full roof replacements, new roofs, and protective coatings for homes across Northwest Georgia — installed by a local crew you can actually talk to.',
    intro: [
      'Your roof takes a beating here. Spring hail, straight-line winds, heavy rain, then a long humid summer that streaks shingles with algae. When it is time for a new roof, you want it done once, done right, and done by people who answer the phone afterward.',
      'We are a locally owned company based in Dalton, and residential roofing is the heart of what we do. Full replacements, new roofs for new builds and additions, and roof coatings that add a protective layer when a full tear-off is not the right call. You will meet a real local crew, and you will see the same faces from the first inspection to the final walkthrough.',
      'Not sure whether you need a repair, a coating, or a full replacement? That is exactly what our free inspection settles. We climb up, look at everything, and tell you plainly what we find — even when the answer is that your roof has years left in it.',
    ],
    features: [
      {
        title: 'Full roof replacement',
        body: 'Complete tear-off and replacement, with your yard and landscaping protected and cleaned up like we were never there.',
      },
      {
        title: 'New roof installation',
        body: 'Roofs for new construction and additions, built to handle Georgia hail, wind, and heat from day one.',
      },
      {
        title: 'Roof coatings',
        body: 'A protective coating can extend the life of the right roof for a fraction of replacement cost. We will tell you honestly if yours qualifies.',
      },
      {
        title: 'Straight answers, in writing',
        body: 'You get a clear written scope of exactly what we found and what we recommend — no pressure, no mystery line items.',
      },
      {
        title: 'A crew that stays local',
        body: 'We live and work in Northwest Georgia. The people who inspect your roof are the same people who stand behind the finished job.',
      },
    ],
    process: [
      {
        title: 'Free inspection',
        body: 'We look at your whole roof — shingles, flashing, decking, ventilation — and walk you through photos of what we found.',
      },
      {
        title: 'A plan that fits',
        body: 'Repair, coating, or replacement: we lay out your real options and what each one costs, then let you decide. No obligation.',
      },
      {
        title: 'Installation day',
        body: 'Our crew shows up when we said we would, protects your property, and works clean. Most homes are wrapped up quickly.',
      },
      {
        title: 'Final walkthrough',
        body: 'We walk the finished roof with you, run a magnetic sweep for nails, and do not call it done until you do.',
      },
    ],
    faqs: [
      {
        q: 'How do I know if I need a full replacement or just a repair?',
        a: 'You often cannot tell from the ground — and honestly, sometimes you cannot tell from the roof without knowing what to look for. That is what the free inspection is for. If a repair or a coating will genuinely solve it, that is what we will recommend.',
      },
      {
        q: 'Will you help me pick shingle colors and materials?',
        a: 'Yes. We will walk you through the options that hold up best in our climate — hail, humidity, and hot summers included — and help you land on a look you will be happy pulling into the driveway to see.',
      },
      {
        q: 'What is a roof coating, and is it right for my house?',
        a: 'A coating is a protective layer applied over an existing roof to seal it and extend its life. It is a great fit for some roofs and the wrong call for others. We will tell you which camp yours is in after we inspect it.',
      },
      {
        q: 'Do you clean up after the job?',
        a: 'Completely. Tarps down during the work, debris hauled off, and a magnetic sweep of your yard and driveway for stray nails before we leave.',
      },
    ],
  },
  {
    slug: 'commercial-roofing',
    name: 'Commercial Roofing',
    shortName: 'Commercial Roofing',
    menuOrder: 2,
    audience: 'commercial',
    heroImage: 'services/commercial-roofing',
    icon: 'building',
    schemaServiceType: 'Commercial Roofing',
    metaDescription:
      'Commercial roofing for Northwest Georgia and Chattanooga businesses. Repairs, replacement, and coatings with minimal disruption. Free inspections.',
    summary:
      'Roof repair, replacement, and coatings for commercial buildings — scheduled around your business, handled by a local crew that communicates.',
    intro: [
      'A commercial roof problem is a business problem. A leak over inventory, a soaked ceiling tile in front of customers, a tenant calling about drips — none of it waits politely for a convenient time. You need someone local who picks up the phone and shows up.',
      'We work on commercial buildings across Northwest Georgia and the Chattanooga area: repairs, full replacements, and coatings that can extend the life of an aging roof without shutting anything down. We plan the work around your hours, keep the site clean and safe, and keep you informed at every step.',
      'It starts the same way every time: a free, no-obligation inspection. We document the roof condition with photos, give you a clear written assessment, and lay out your options — including the ones that cost less. Book online or call, and let us take a look.',
    ],
    features: [
      {
        title: 'Commercial roof repair',
        body: 'Leaks, storm damage, failed flashing, ponding areas — found, documented with photos, and fixed properly.',
      },
      {
        title: 'Full replacement',
        body: 'When a roof is past saving, we replace it on a schedule built around your operations, not ours.',
      },
      {
        title: 'Roof coatings',
        body: 'The right coating can add years to a commercial roof at a fraction of replacement cost. We will tell you if yours is a candidate.',
      },
      {
        title: 'Storm damage documentation',
        body: 'After hail or wind, we photograph and document everything so you have a clean record for your insurance carrier.',
      },
      {
        title: 'One point of contact',
        body: 'You deal with the same local people from inspection to final walkthrough. No call centers, no runaround.',
      },
    ],
    process: [
      {
        title: 'Free roof assessment',
        body: 'We inspect the full roof system and document its condition with photos, then give you a written report in plain English.',
      },
      {
        title: 'Options and scheduling',
        body: 'Repair, coat, or replace — we price your real options and build a schedule that keeps your business running.',
      },
      {
        title: 'The work',
        body: 'A safe, clean, organized site. We coordinate access, protect what is below, and communicate daily until it is done.',
      },
      {
        title: 'Walkthrough and records',
        body: 'We walk the finished roof with you and hand over documentation of the completed work for your building file.',
      },
    ],
    faqs: [
      {
        q: 'Can you work around our business hours?',
        a: 'Yes. We schedule commercial work to minimize disruption — around shifts, customer hours, and deliveries. Tell us the constraints and we will build the plan around them.',
      },
      {
        q: 'Do we have to replace the whole roof, or can it be repaired or coated?',
        a: 'Plenty of commercial roofs get written off too early. If a targeted repair or a coating will genuinely buy you years, we will say so — that honest answer is the whole point of the free inspection.',
      },
      {
        q: 'Do you handle storm damage insurance claims for commercial buildings?',
        a: 'We document the damage thoroughly with photos and a written assessment, and we will work alongside you and your carrier through the claim. You will not be navigating it alone.',
      },
      {
        q: 'Are you licensed and insured for commercial work?',
        a: 'Yes — licensed and insured, and happy to provide documentation before any work begins.',
      },
    ],
  },
  {
    slug: 'roof-repair',
    name: 'Roof Repair',
    shortName: 'Roof Repair',
    menuOrder: 3,
    audience: 'both',
    heroImage: 'services/roof-repair',
    icon: 'hammer',
    schemaServiceType: 'Roof Repair',
    metaDescription:
      'Roof leak and storm damage repair in Dalton and Northwest Georgia. Hail, wind, and insurance claim help from a local licensed crew. Free inspections.',
    summary:
      'Leaks, hail hits, wind-lifted shingles, and storm damage — diagnosed honestly and fixed right, with help on the insurance claim when you need it.',
    intro: [
      'A water stain on the ceiling. Shingles in the yard after a storm. A drip you can hear but cannot find. Roof problems rarely announce themselves politely, and the longer they wait, the more they cost. The good news: most of them are very fixable.',
      'Northwest Georgia weather does real damage — spring hail, straight-line winds, and heavy rain find every weak spot. We repair storm damage and everyday wear on homes and commercial buildings alike, and when the damage is storm-related, we help you document it and walk through the insurance claim so you are not deciphering it alone.',
      'Every repair starts with a free, no-obligation inspection. We find the actual source of the problem — not just where the water shows up — show you photos, and give you a straight answer on the fix. Book online in under a minute or give us a call.',
    ],
    features: [
      {
        title: 'Leak detection and repair',
        body: 'Water travels. We trace the leak to its real source and fix the cause, not just the symptom.',
      },
      {
        title: 'Storm and hail damage repair',
        body: 'Hail bruising, wind-lifted shingles, and impact damage repaired before small problems become interior ones.',
      },
      {
        title: 'Insurance claim help',
        body: 'We document damage with photos, meet the adjuster if you want us there, and help you understand what your claim covers.',
      },
      {
        title: 'Flashing and penetration repair',
        body: 'Chimneys, vents, and valleys are where most leaks start. We reseal and reflash them properly.',
      },
      {
        title: 'Honest verdicts',
        body: 'If a repair will hold, we repair it. If the roof is truly done, we will show you exactly why. You decide either way.',
      },
    ],
    process: [
      {
        title: 'Free inspection',
        body: 'We inspect the roof and attic side where needed, find the real source, and document everything with photos.',
      },
      {
        title: 'Straight diagnosis',
        body: 'You get a plain-English explanation of the damage, the fix, and the cost — plus claim guidance if a storm caused it.',
      },
      {
        title: 'The repair',
        body: 'Our crew fixes it right the first time and leaves the site clean. Same local faces you met at the inspection.',
      },
      {
        title: 'Follow-through',
        body: 'We walk you through the completed repair and the photos, so you know exactly what was done up there.',
      },
    ],
    faqs: [
      {
        q: 'How do I know if my roof has hail damage?',
        a: 'Often you cannot see it from the ground — hail bruises shingles in ways that show up close. If a storm rolled through your area, get a free inspection. We will show you photos of anything we find, and if there is no damage, we will tell you that too.',
      },
      {
        q: 'Will you help with my insurance claim?',
        a: 'Yes. We document the damage thoroughly, can be there when the adjuster comes, and help you make sense of the process. The claim is yours, but you will not walk through it alone.',
      },
      {
        q: 'My ceiling has a water stain. Is that an emergency?',
        a: 'It is a "call soon" — water is getting past the roof and it will not fix itself. The sooner we trace it, the smaller the repair usually is. Book an inspection and we will find the source.',
      },
      {
        q: 'Do you repair both homes and commercial buildings?',
        a: 'We do. Residential and commercial roof repair across Northwest Georgia and the Chattanooga area, from single missing shingles to major storm damage.',
      },
    ],
  },
  {
    slug: 'siding',
    name: 'Siding Installation & Repair',
    shortName: 'Siding',
    menuOrder: 4,
    audience: 'both',
    heroImage: 'services/siding',
    icon: 'siding',
    schemaServiceType: 'Siding Installation',
    metaDescription:
      'Siding installation and repair in Dalton, GA and Northwest Georgia. Storm damage fixes and full re-sides by a local, licensed crew. Free inspections.',
    summary:
      'New siding installation and honest repairs that protect your walls from Georgia weather and give the whole place a fresh face.',
    intro: [
      'Siding is not just about looks — it is the jacket your building wears through every hailstorm, wind gust, and humid August. When it cracks, warps, or comes loose, water finds its way behind it, and that is when the expensive problems start.',
      'We install new siding and repair damaged siding on homes and commercial buildings across Northwest Georgia and the Chattanooga area. Sometimes that means matching and replacing a few storm-cracked panels. Sometimes it means a full re-side that transforms the whole property. Either way, you will work with the same local crew from the first look to the final walkthrough.',
      'Start with a free inspection. We will check for hidden trouble — soft spots, water intrusion, failing trim — and give you an honest read on whether you need a repair or a fresh start. No pressure, no obligation.',
    ],
    features: [
      {
        title: 'New siding installation',
        body: 'Full installation with proper moisture protection underneath, so it looks good and stays dry for the long haul.',
      },
      {
        title: 'Siding repair and matching',
        body: 'Cracked, warped, or wind-torn sections replaced and matched as closely as possible to what is already on the wall.',
      },
      {
        title: 'Storm damage assessment',
        body: 'Hail and wind damage documented with photos, with help on the insurance claim when the storm is to blame.',
      },
      {
        title: 'Trim, soffit, and fascia',
        body: 'The details that finish the job and keep water out of the edges — handled as part of the work, not an afterthought.',
      },
    ],
    process: [
      {
        title: 'Free inspection',
        body: 'We look at every wall, probe for hidden moisture damage, and show you photos of exactly what we find.',
      },
      {
        title: 'Repair or replace',
        body: 'A clear recommendation with real numbers for each option. If a repair honestly solves it, that is what we suggest.',
      },
      {
        title: 'Installation',
        body: 'Old material off, problems underneath fixed, new siding on straight — with daily cleanup as we go.',
      },
      {
        title: 'Walkthrough',
        body: 'We walk the whole exterior with you and make it right before we call it finished.',
      },
    ],
    faqs: [
      {
        q: 'Can you repair just one section, or do I have to redo the whole house?',
        a: 'We repair single sections all the time, and we will match the existing siding as closely as we can. If the rest of the siding is near the end of its life, we will tell you — but the choice is always yours.',
      },
      {
        q: 'Can hail really damage siding?',
        a: 'Absolutely. Hail cracks and dents siding just like it bruises shingles, and wind can pull panels loose. If a storm hit your area, a free inspection will tell you where you stand — and we can help document it for insurance.',
      },
      {
        q: 'How disruptive is a full siding job?',
        a: 'There is some noise during the day, but you can live and work normally through it. We protect landscaping, clean up daily, and keep you posted on the schedule.',
      },
    ],
  },
  {
    slug: 'windows',
    name: 'Window Replacement',
    shortName: 'Windows',
    menuOrder: 5,
    audience: 'both',
    heroImage: 'services/windows',
    icon: 'window',
    schemaServiceType: 'Window Installation',
    metaDescription:
      'Window replacement in Dalton, GA and Northwest Georgia. Drafty, foggy, or storm-damaged windows replaced by a local, licensed crew. Free inspections.',
    summary:
      'Drafty, foggy, or stuck windows replaced with properly sealed new ones — installed by a local crew that treats your place like their own.',
    intro: [
      'You can feel a bad window before you can see it. A draft in January, a room that will not cool down in July, fog trapped between panes, a sash that takes two hands and a prayer to open. Windows fail slowly, and then all at once on your power bill.',
      'We replace windows in homes and commercial buildings across Northwest Georgia and the Chattanooga area. The window itself matters, but the install matters more — a good window sealed badly still leaks air and water. Our crew measures carefully, sets each unit square, and seals it right, and you will see the same faces from the first visit to the final walkthrough.',
      'Wondering whether your windows are the problem? Book a free inspection. We will check each one, tell you which ones actually need replacing, and leave the decision entirely with you.',
    ],
    features: [
      {
        title: 'Full window replacement',
        body: 'Old units out, new ones set level and square, insulated and sealed against Georgia heat, cold snaps, and driving rain.',
      },
      {
        title: 'Foggy and failed-seal glass',
        body: 'Condensation between panes means the seal is gone. We replace the unit so you get your view and your efficiency back.',
      },
      {
        title: 'Storm-damaged windows',
        body: 'Hail-cracked and wind-damaged windows replaced, with photo documentation to support an insurance claim when one applies.',
      },
      {
        title: 'Whole-home and phased projects',
        body: 'Replace every window at once or a few at a time as budget allows — we will help you prioritize the worst offenders first.',
      },
    ],
    process: [
      {
        title: 'Free window inspection',
        body: 'We check every window for seal failure, rot, drafts, and operation, then tell you which ones truly need attention.',
      },
      {
        title: 'Measure and order',
        body: 'Careful measurements and a clear written quote. Your windows are ordered to fit your openings, not the other way around.',
      },
      {
        title: 'Installation',
        body: 'Clean removal, precise installation, proper insulation and sealing — with your floors and furniture protected throughout.',
      },
      {
        title: 'Final walkthrough',
        body: 'We operate every window with you, inside and out, and clean up so thoroughly the only evidence is the new glass.',
      },
    ],
    faqs: [
      {
        q: 'How do I know it is time to replace my windows?',
        a: 'Drafts, fog between panes, windows that stick or will not stay open, and rooms that never hold temperature are the classic signs. A free inspection sorts out which windows are actually failing — often it is fewer than you fear.',
      },
      {
        q: 'Do I have to replace all my windows at once?',
        a: 'No. Plenty of folks phase the work. We will help you rank the worst ones so each round of the project does the most good.',
      },
      {
        q: 'How long does window replacement take?',
        a: 'It depends on the count and the openings, but most installs move quickly once the windows arrive. We will give you a real timeline with your quote and stick to it.',
      },
    ],
  },
  {
    slug: 'gutters',
    name: 'Gutter Replacement & Repair',
    shortName: 'Gutters',
    menuOrder: 6,
    audience: 'both',
    heroImage: 'services/gutters',
    icon: 'gutter',
    schemaServiceType: 'Gutter Installation',
    metaDescription:
      'Gutter replacement, repair, and gutter guards in Dalton, GA and Northwest Georgia. Keep heavy rain away from your foundation. Free inspections.',
    summary:
      'New gutters, honest repairs, and gutter guards that keep Northwest Georgia rain moving away from your roofline and foundation.',
    intro: [
      'Gutters are the most ignored part of any building — right up until water is pouring over the edge, pooling at the foundation, or freezing into a January ice sheet on the walkway. In a region that gets heavy rain the way ours does, they are doing more work than they get credit for.',
      'We replace, repair, and protect gutters on homes and commercial buildings across Northwest Georgia and the Chattanooga area. Sagging runs re-hung, leaking seams sealed, crushed downspouts replaced, and full new systems sized for real Georgia downpours. Add gutter guards and you can mostly retire the ladder — no more scooping leaves every fall.',
      'Since we are already up there, gutter checks fold naturally into our free roof inspections. We will look at the whole system, show you photos, and tell you honestly whether it needs a tune-up or a replacement. Book online or call — it takes less than a minute.',
    ],
    features: [
      {
        title: 'Gutter replacement',
        body: 'New systems sized and pitched for heavy Southern rain, hung solid so they stay put through storm season.',
      },
      {
        title: 'Gutter repair',
        body: 'Leaking seams, sagging sections, loose hangers, and damaged downspouts fixed before water starts working on your foundation.',
      },
      {
        title: 'Gutter guards',
        body: 'Guards that keep leaves and debris out so water keeps moving — and you stay off the ladder in the fall.',
      },
      {
        title: 'Downspouts and drainage',
        body: 'Water routed away from the building, not dumped beside the foundation where it does quiet, expensive damage.',
      },
    ],
    process: [
      {
        title: 'Free inspection',
        body: 'We check pitch, seams, hangers, downspouts, and drainage, and photograph anything that is not doing its job.',
      },
      {
        title: 'Clear recommendation',
        body: 'Repair, replace, or add guards — you get straight options with real pricing and zero pressure to pick the biggest one.',
      },
      {
        title: 'Installation',
        body: 'Old material hauled off, new gutters hung level and pitched right, downspouts placed where the water should actually go.',
      },
      {
        title: 'Rain-ready walkthrough',
        body: 'We walk the system with you and make sure everything drains the way it should before we leave.',
      },
    ],
    faqs: [
      {
        q: 'Are gutter guards worth it?',
        a: 'If you have trees near the house, usually yes. Guards keep leaves and debris from clogging the system, which protects your fascia and foundation and keeps you off the ladder. We will give you an honest read for your specific setup.',
      },
      {
        q: 'How do I know if my gutters are failing?',
        a: 'Water spilling over the edge in a hard rain, sagging runs, peeling paint on the fascia, and puddles or erosion at the foundation are the big tells. A free inspection will confirm what is going on.',
      },
      {
        q: 'Can you replace gutters when you replace my roof?',
        a: 'Yes, and it is often the smartest time to do it — the crew is already there and the two systems are designed to work together. Ask about it during your free inspection.',
      },
      {
        q: 'Do gutters really matter that much?',
        a: 'They do. Around here, heavy rain and the occasional winter ice will find every weak point. Working gutters protect your siding, fascia, landscaping, and most importantly your foundation.',
      },
    ],
  },
];

export const services: Service[] = raw.map((s) => ServiceSchema.parse(s));

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
