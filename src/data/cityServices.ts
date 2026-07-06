import { CityServiceSchema, type CityService } from './types';

/**
 * City x service combo pages. Every combo carries its own locally written
 * intro (>=150 words, no recycled copy) so these pages earn their place in
 * the index instead of reading like doorway pages. Parsed through
 * CityServiceSchema at import time.
 */
const raw: CityService[] = [
  // ─────────────────────────── residential-roofing ───────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roofing in Dalton, GA from the crew headquartered on Coronet Dr. Full replacements done right. Free inspection: (678) 348-0273.',
    intro: [
      'When your Dalton home needs a new roof, the crew you hire should not need directions to your street. Our shop is at 1225 Coronet Dr, which means the people measuring your roof are the same neighbors who sit behind you in traffic on Walnut Avenue. We replace roofs across Whitfield County — architectural shingle, metal, the works — and we spec every one for the hail and wind that ride the I-75 corridor through here each spring.',
      "Dalton's housing has range, from carpet-boom ranches to older two-stories near downtown, and a good replacement respects what the house is. We tear off to the deck, fix what we find, and install a complete system — underlayment, ventilation, and shingles built for humid North Georgia summers that streak lesser products green. Being local also means a share of every job goes to a charity our customer chooses. It starts with a free, no-obligation inspection: book online or call (678) 348-0273, Monday through Saturday, 9 to 9.",
    ],
  },
  {
    citySlug: 'calhoun-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'New residential roofs in Calhoun, GA installed by a Dalton crew 22 miles up the interstate. Free honest inspections. Call (678) 348-0273.',
    intro: [
      'Calhoun grew quickly along I-75, and plenty of Gordon County roofs went on quickly too. Twenty years later, we get called to houses where the shingles were fine but the details never were — skipped starter courses, thin flashing, vents cut short. A proper residential roof replacement fixes all of it at once, and since our Dalton shop is only 22 miles away, we can walk your roof this week rather than next month.',
      'Whether you are in an established neighborhood near the downtown square or a newer build out by the exits, we match the roof system to the house and to Gordon County weather — hail in spring, straight-line wind in summer, heavy rain in between. You will meet the same local crew at the inspection, on the roof, and at the final walkthrough. Every project starts with a free inspection and a written scope you can actually read. Book online in under a minute or dial (678) 348-0273.',
    ],
  },
  {
    citySlug: 'chatsworth-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roof replacement in Chatsworth, GA — wind-rated systems for the Cohutta foothills, installed by neighbors from Dalton. (678) 348-0273.',
    intro: [
      'Roofs in Chatsworth work harder than roofs twelve miles west in Dalton, and we say that as the crew that drives Highway 52 between the two every week. The closer you get to the Cohutta foothills, the more wind, limbs, and freeze-thaw your shingles absorb. When we replace a residential roof in Murray County, we spec higher wind ratings and nail-down schedules that assume the gusts coming off the mountain, not the averages on a brochure.',
      'From homes near the courthouse to houses on acreage up toward Fort Mountain, we handle tear-off, decking repairs, and full installation — shingle or metal, whichever suits the house and the exposure. Because we are only a twenty-minute drive away, checking in on your project mid-build is easy for you and routine for us, and we stay licensed and insured on every Murray County job. The look-over costs you nothing and obligates you to nothing. Call (678) 348-0273 or grab a time online, Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'ringgold-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roofing in Ringgold, GA built for the I-75 hail corridor. Local Dalton crew, free storm inspections, no pressure. (678) 348-0273.',
    intro: [
      'Ringgold sits in one of the busiest hail lanes in North Georgia — storm cells love to ride I-75 through Catoosa County, and the shingles on your house keep the score. If your roof is on its second or third round of patched hail hits, a full residential replacement is usually cheaper than chasing leaks for another five years. We are 17 miles down the interstate in Dalton, close enough to show up fast and local enough to still be here when the warranty question comes up.',
      'This town rebuilt itself after 2011, and it knows the difference between a contractor and a stranger with a yard sign. We install complete roof systems — underlayment, ice-and-water in the valleys, proper ventilation — sized for Catoosa County weather. We hold Georgia licensing and insurance, and we answer the phone ourselves from 9 to 9, Monday through Saturday. Start with a free, no-obligation inspection: (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'fort-oglethorpe-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'New roofs for Fort Oglethorpe, GA homes — brick ranches to new builds — from a licensed Dalton crew. Free no-obligation inspection. (678) 348-0273.',
    intro: [
      "Fort Oglethorpe's brick ranches were built to last, and most of them have — but the roofs above them were never meant to go this long. On the flat, open ground near the Chickamauga Battlefield, wind gets an uninterrupted run at your shingles, and the postwar rooflines here often hide two or three old layers underneath. We strip it all, inspect the decking honestly, and build back a residential roof system rated for what the valley actually throws at it.",
      'We make the 25-mile run from our Dalton shop to Catoosa County constantly, so scheduling is simple and follow-up is real. You get a written scope, a clean job site, and a crew that treats a modest ranch with the same care as a big new build off Battlefield Parkway. A portion of what you spend goes to a charity of your choosing, a habit we keep on every job. The first step is free — schedule an inspection online or at (678) 348-0273.',
    ],
  },
  {
    citySlug: 'lafayette-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roof replacement in LaFayette, GA — built for valley wind between Pigeon Mountain and Taylor Ridge. Free inspections. (678) 348-0273.',
    intro: [
      'The valley LaFayette sits in acts like a wind tunnel when storms squeeze between Pigeon Mountain and Taylor Ridge, and we see the results on Walker County roofs all the time: lifted tabs, creased shingles, ridge caps gone missing. If your roof has been patched past the point of sense, we will tell you plainly — and if replacement is the right call, we will build you one engineered for the wind this valley actually delivers.',
      'A lot of LaFayette homes are older, and older houses deserve a contractor who checks the decking and framing before covering them up again. We drive over from Dalton — about 26 miles — with everything needed to do it right the first time. Working families keep this town running, so we hold evening and Saturday appointments that do not cost you a day of leave. The inspection is free, the advice is straight, and the number is (678) 348-0273, Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'rome-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roofing in Rome, GA for historic homes and new builds alike. Dalton-based, licensed and insured, free inspections. (678) 348-0273.',
    intro: [
      "Rome's roofs have character — steep pitches on the historic homes near downtown, long low runs on the mid-century neighborhoods, and everything in between out toward Berry College. Character means complexity, and complexity is where cut-rate roofers get in trouble. We plan every Rome replacement around the actual roofline: proper flashing at every wall and chimney, ice-and-water in every valley, ventilation matched to the attic it serves.",
      'Floyd County adds its own pressures. Three rivers keep the air damp, mature hardwoods drop limbs in every storm, and algae streaks show up on shingles that were never rated to resist them. We make the 40-mile drive from Dalton weekly, so distance changes nothing about our response. We photograph the decking before it is covered, flag anything questionable, and leave you a record a future buyer or insurer can actually use. See what your roof needs with a free, no-obligation inspection — book online or call (678) 348-0273.',
    ],
  },
  {
    citySlug: 'cartersville-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Roof replacement for Cartersville, GA homes — from historic downtown to newer subdivisions near Allatoona. Free inspections. (678) 348-0273.',
    intro: [
      'Whole streets of Cartersville are hitting the same milestone at once: builder-grade shingles from the growth years reaching the end of their first life together. If your neighbors are replacing roofs, yours is probably on the same clock — Bartow County hail does not skip houses. We replace residential roofs across Cartersville with systems chosen for I-75 corridor weather, not for whatever was cheapest per square the year the subdivision went in.',
      'We also do right by the older side of town. Historic downtown homes get careful tear-offs, decking repairs where a century of weather demands them, and materials that suit the architecture. Our crew comes down from Dalton — 45 miles, about 45 minutes — with a written scope before work and a magnet sweep after. Licensing and insurance cover every Bartow County job we take, and we will show the paperwork before you sign a thing. Claim your free inspection at (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'ellijay-ga',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Mountain-ready residential roofing in Ellijay, GA — metal and shingle for cabins and homes in Gilmer County. Free inspections. (678) 348-0273.',
    intro: [
      'A roof in Ellijay lives a different life than a roof in the valley. Up in the hollows around the orchards, it takes harder wind, catches every limb the hardwoods drop, and freezes and thaws on mornings Dalton never notices. That is why so much of Gilmer County wears metal, and why we install both standing-seam metal and high-wind shingle systems on mountain homes and cabins alike.',
      'If your place is a rental cabin, downtime is money — we schedule replacements around your booking calendar and leave the site guest-ready. If it is your full-time home, we walk you through the metal-versus-shingle math honestly, including snow shedding and limb impact. We plan mountain jobs around the weather windows the ridges actually allow, not around some distant call center calendar three states away. Either way, the first visit is a free, no-obligation inspection. Call (678) 348-0273 or book online; we make the Highway 52 drive from Dalton all the time.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roofing in Chattanooga, TN — steep historic rooflines to suburban builds — from a Dalton, GA crew 30 miles out. (678) 348-0273.',
    intro: [
      "Chattanooga's residential rooflines keep us on our toes — steep, cut-up roofs on the historic homes near the North Shore and downtown, sprawling suburban roofs in the valley, and everything perched against the base of Lookout Mountain. Storms rolling off the Cumberland Plateau punish sloppy installation, so we build every replacement as a full system: sealed valleys, correct step flashing on those old brick chimneys, and ventilation that fights the Tennessee River humidity instead of trapping it.",
      'Our shop is 30 miles south in Dalton, an easy run up I-75, and we are licensed and insured on both sides of the line. You will get a plain-English scope, one point of contact, and a roof spec matched to your specific house rather than a one-size quote. A slice of every Chattanooga project also goes to a charity the homeowner picks. Book your free inspection online or call (678) 348-0273 — Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'ooltewah-tn',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roof replacement in Ooltewah, TN — honest evaluations for hail-aged subdivision roofs. Dalton-based crew. Call (678) 348-0273.',
    intro: [
      'Most of Ooltewah went up in the last twenty years, which means most of Ooltewah is now due for its first real roof decision. Builder-grade shingles installed street by street are aging street by street, and every hail cell that tracks I-75 through this end of Hamilton County speeds up the timeline. When the storm-chaser trucks flood the neighborhood, it helps to have a crew from 26 miles away instead of 600.',
      'We evaluate whether your roof genuinely needs replacement or just honest repairs — and we put it in writing either way. When it is time, we install full systems upgraded from what the builder chose: better shingles, real underlayment, ventilation sized for these tightly built newer homes. Our trucks already run this stretch of I-75 weekly, so follow-ups happen when promised, and evening appointments suit the commuters who make this community work. Free inspection, zero pressure, on your schedule: (678) 348-0273 or online booking, Monday through Saturday.',
    ],
  },
  {
    citySlug: 'cleveland-tn',
    serviceSlug: 'residential-roofing',
    metaDescription:
      'Residential roofing in Cleveland, TN from a licensed Dalton, GA crew 27 miles down I-75. Full replacements, free inspections. (678) 348-0273.',
    intro: [
      'Bradley County storms ride the valley northeast and take their toll block by block — creased shingles on the west-facing slopes, hail bruising you cannot see from the ground, gutters full of granules. When a Cleveland roof reaches that stage, patching becomes a subscription. We replace residential roofs across the city, from the historic homes near downtown to the ranches and newer subdivisions on the edges, with systems specced for exactly this weather.',
      'Cleveland is one of our regular Tennessee runs — 27 miles from the Dalton shop up I-75 and US-64 — and we carry licensing and insurance that cover us fully in Tennessee. You deal with one local company from inspection to final walkthrough, and part of the proceeds goes to a charity you pick. Hail claims are common in Bradley County, and our written findings give you solid footing if you decide to file one. Set up your free, no-obligation inspection at (678) 348-0273 or online.',
    ],
  },

  // ─────────────────────────────── roof-repair ───────────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Dalton, GA — leaks, hail hits, and wind damage fixed fast by the crew based on Coronet Dr. Free inspection: (678) 348-0273.',
    intro: [
      'A leak in Dalton does not have to wait on a contractor from somewhere else. We repair roofs in the same town where we park our trucks every night, so a ceiling stain on Tuesday can be a fixed roof by the weekend. Whitfield County repairs usually trace back to the same culprits: hail bruises from spring cells on the I-75 corridor, wind-lifted shingles, and flashing that gave up around a chimney or valley.',
      'We fix the actual problem, not just the symptom — that means tracing water to its entry point, replacing what failed, and matching materials so the patch does not announce itself from the street. If the damage is beyond sensible repair, we say so before you spend a dime. Evenings and Saturdays are regular working hours for us here, not special favors. The diagnosis is a free, no-obligation inspection: call (678) 348-0273 or book online, Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'calhoun-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Fast roof repair in Calhoun, GA — leaks traced and fixed by a Dalton crew 25 minutes up I-75. Free leak inspections. Call (678) 348-0273.',
    intro: [
      'Water finds the weak spot, and in Calhoun the weak spot is often a detail that got rushed when the house went up during the growth years — a valley without ice-and-water shield, a pipe boot cracked after one too many Georgia summers, flashing tucked wrong against a chimney. Our repair crew comes down from Dalton, 25 minutes on I-75, diagnoses where the water is actually getting in, and fixes that spot properly.',
      'Gordon County storms add their own damage list: shingles creased by straight-line wind, hail bruising that turns into leaks a year later, gutters and drip edge bent out of alignment. Small repairs done promptly are the cheapest roofing you will ever buy. Most Calhoun repairs wrap up the same day we start them, weather permitting. Get eyes on it before the next storm — the inspection is free and comes with photos of what we find. (678) 348-0273, Monday through Saturday.',
    ],
  },
  {
    citySlug: 'chatsworth-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Chatsworth, GA — wind damage, limb strikes, and leaks fixed by neighbors 12 miles away in Dalton. Call (678) 348-0273.',
    intro: [
      'In Murray County, half our repair calls start with a tree. Limbs come down in the wind off the Cohutta foothills, punch through shingles or crack decking, and the leak shows up two rooms away from the hole. We are 12 miles down Highway 52 in Dalton — close enough to tarp an emergency the same day and come back with a permanent fix once the weather clears.',
      'The other half of Chatsworth repairs is straight mountain wear: wind-lifted shingles on exposed slopes, ridge caps loosened by gusts the valley never felt, and ice damage on higher lots after cold snaps. We repair shingle and metal roofs both, match materials as closely as manufacturing allows, and photograph everything so you see what we saw. If a storm rolls off the mountain after dark, call anyway; the phone is answered until 9. The look costs nothing — call (678) 348-0273 or book your free inspection online.',
    ],
  },
  {
    citySlug: 'ringgold-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Hail and storm roof repair in Ringgold, GA from a local Dalton crew — not a storm chaser. Free damage inspections, photos included. (678) 348-0273.',
    intro: [
      'After hail rakes Catoosa County, Ringgold driveways fill up with out-of-town trucks within 48 hours. Here is the difference with us: we were 17 miles away before the storm, and we will be 17 miles away five years after. Our repair work covers the full storm menu — bruised and cracked shingles, wind-creased tabs, dented vents and flashing, and the slow leaks that hail damage turns into the following winter.',
      'We document damage with photos, mark every hit, and give you an honest count — enough for a real repair scope, and useful if you decide to involve your insurance company. If the damage does not justify work, we tell you that too and shake hands. Georgia licensing and insurance back every repair, and we will happily prove both before anything is signed. Schedule a free, no-obligation storm inspection at (678) 348-0273 or online; we run crews Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'fort-oglethorpe-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof leak and wind damage repair in Fort Oglethorpe, GA by a licensed Dalton crew. Free inspections with photo documentation. (678) 348-0273.',
    intro: [
      'The wind crossing the open ground around the Chickamauga Battlefield does a specific kind of damage to Fort Oglethorpe roofs: it works shingle edges loose a little at a time until one storm finally peels them. If you have seen a tab in the yard or a flap lifting on a breezy day, the leak is already scheduled — you just have not met it yet. We repair it before it introduces itself.',
      "Many of this town's postwar ranches also carry aging pipe boots, rusted valley metal, and chimney flashing from a different era, and those quiet failures cause more ceiling stains than storms do. Our crew covers Catoosa County from Dalton, 25 miles out, with materials on the truck to close most repairs in one visit. Saturday appointments stay open as well, because leaks have never once respected anyone's work week. Start with a free inspection — (678) 348-0273 or book online.",
    ],
  },
  {
    citySlug: 'lafayette-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in LaFayette, GA — valley wind damage and stubborn leaks fixed right by a Dalton-based crew. Free inspections. (678) 348-0273.',
    intro: [
      'When wind squeezes through the gap between Pigeon Mountain and Taylor Ridge, LaFayette roofs pay for it — shingles creased along the ridgelines, caps scattered into yards, and leaks that open up on the windward slopes. We repair that damage for what it is, replacing compromised shingles instead of gluing down ones that have already lost their seal and will lift again in the next blow.',
      'Walker County also keeps us busy with the patient kind of leak: older homes where decades of small patches finally stop cooperating. We trace water from the stain back to the entry point, even when they are half a roof apart, and quote only what actually needs fixing. Photos come standard with every LaFayette repair, so you see the before and after without ever climbing a ladder. The drive from Dalton is 26 miles and the inspection is free. Reach us at (678) 348-0273, Monday through Saturday, 9 to 9, or book online.',
    ],
  },
  {
    citySlug: 'rome-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Rome, GA — limb damage, flashing failures, and leaks on historic and modern homes. Free inspections from Dalton. (678) 348-0273.',
    intro: [
      "Rome's mature hardwoods are beautiful right up until a storm turns them into roofing projects. Limb strikes are our most common Floyd County repair call, followed closely by flashing failures on the complicated rooflines of the older homes near downtown — chimneys, dormers, and dead valleys that all need metal work done precisely. We bring the fabrication skills those details demand, not just a bundle of shingles and a caulk gun.",
      'River-valley humidity complicates things further, feeding algae and moss that hold moisture against shingles until they fail early on shaded slopes. We repair the damage and address the cause where we can. Rome is a 40-mile run from our Dalton shop and we make it weekly, so response time stays reasonable. Evening slots suit a lot of Rome schedules, and ours run to 9 at night, six days a week. Your inspection is free and comes with no obligation — call (678) 348-0273 or schedule online.',
    ],
  },
  {
    citySlug: 'cartersville-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Cartersville, GA — hail hits, wind damage, and builder-grade shortcuts fixed properly. Free inspections. Call (678) 348-0273.',
    intro: [
      'A lot of Cartersville repair calls are really warranty-age problems arriving early: subdivision roofs from the boom years where three-tab shingles, minimal flashing, and rushed installation are giving out ahead of schedule. We repair those roofs honestly — fixing what failed today and flagging what will fail next, so you can budget instead of getting surprised. Bartow County hail off the I-75 corridor rarely waits for convenient timing.',
      'Out toward Allatoona and in the historic downtown blocks, the repair work changes character — more tree exposure by the lake, more careful matching on older homes — and we adjust the approach to fit. Every repair visit ends with photos of the finished work. We drive down from Dalton with the truck stocked to finish most jobs same-day. If your insurer gets involved, that documentation gives the adjuster something concrete to work from instead of a guess. Free inspection, no strings: (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'ellijay-ga',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Ellijay, GA — metal and shingle fixes for cabins and mountain homes in Gilmer County. Free inspections. Call (678) 348-0273.',
    intro: [
      'Mountain roofs break differently. In Ellijay we repair limb punctures after every windstorm, chase leaks at metal roof penetrations and panel seams, and fix ice-related damage that valley towns simply do not get. Cabins on wooded Gilmer County slopes take the worst of it — and if yours is a rental, a leak is not just damage, it is canceled bookings. We prioritize speed on those calls and coordinate around guests.',
      'We work on standing seam, exposed-fastener metal, and shingle roofs alike, which matters up here where metal is everywhere and plenty of repair outfits only know asphalt. Backed-out fasteners, failed boots, rusted flashing at stone chimneys — we handle all of it in one trip when we can. Turnover days between guests make ideal repair windows, and we book them on purpose. The drive from Dalton over Highway 52 is 34 miles and worth it. Free, no-obligation inspections: (678) 348-0273 or online.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Chattanooga, TN — leaks on steep historic roofs and storm damage citywide, fixed by a Dalton, GA crew. Call (678) 348-0273.',
    intro: [
      'Steep, complicated roofs are where Chattanooga leaks like to hide. The historic homes near downtown and the North Shore stack dormers, chimneys, and intersecting slopes into rooflines where water can travel a long way from entry point to ceiling stain — and where guessing gets expensive. We diagnose before we quote, tracing the actual path of the water, then repair the flashing, valley, or shingle failure at its source.',
      'Across the rest of Hamilton County, plateau storms hand us the usual list: wind-stripped slopes, hail-bruised shingles, limbs through decking. Our crew runs up from Dalton — about 35 minutes on I-75 — licensed and insured in Tennessee, and we photograph every repair so you never take our word for what happened up there. From the North Shore to the valley suburbs, our response time stays measured in days rather than weeks. The first look is free: (678) 348-0273, or book online any Monday through Saturday.',
    ],
  },
  {
    citySlug: 'ooltewah-tn',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Ooltewah, TN — hail checks and honest fixes for newer subdivision roofs, from a Dalton, GA crew 26 miles out. (678) 348-0273.',
    intro: [
      'A roof does not have to be old to need repair — Ooltewah proves it every hail season. Newer subdivision roofs off the I-75 corridor take the same hits as everything else in Hamilton County, and builder-grade shingles bruise easily. The tricky part is that hail damage on a young roof hides well: no missing shingles, no drama, just fractured mats that start leaking a winter or two later. We find those hits and fix them while they are still small.',
      'We also see plenty of construction-era shortcuts surfacing in homes around the Collegedale area — nail pops lifting shingles in neat rows, skylights and pipe boots flashed in a hurry. Whatever the cause, you get photos, a plain answer, and a repair that ends the problem. Our shop is 26 miles south in Dalton, close enough that a follow-up visit is never a negotiation. Free inspections, Monday through Saturday, 9 to 9 — (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'cleveland-tn',
    serviceSlug: 'roof-repair',
    metaDescription:
      'Roof repair in Cleveland, TN — storm damage and leaks fixed by a licensed Dalton, GA crew that works Bradley County weekly. (678) 348-0273.',
    intro: [
      'When a storm runs the valley through Bradley County, Cleveland roofs collect the evidence: tabs in the yard on Keith Street, granules piling in downspouts, and drips that show up two rooms from the actual hole. We repair storm damage across the city — from the historic homes near downtown to the newer subdivisions on the edges — and we get there quickly, because our Dalton shop is only 27 miles down I-75.',
      'Not every Cleveland leak is storm-born. Humid Tennessee Valley summers cook pipe boots until they split, and algae-shaded slopes on older roofs wear out years early; both leak quietly until the ceiling tells on them. We trace the water, fix the entry point, and match materials so the repair disappears into the roof. One number covers Cleveland businesses too, since we handle commercial roofs across Bradley County. Diagnosis is a free, no-obligation inspection — call (678) 348-0273 or book a time online.',
    ],
  },

  // ───────────────────────────── commercial-roofing ─────────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'commercial-roofing',
    metaDescription:
      'Commercial roofing in Dalton, GA — flat, low-slope, and metal systems for mills, warehouses, and storefronts. Free evaluations. (678) 348-0273.',
    intro: [
      'The Carpet Capital of the World runs on big roofs. Mills, warehouses, distribution buildings, and storefront strips line the I-75 corridor through Whitfield County, and most of them sit under flat or low-slope systems that fail quietly — ponding water, split seams, clogged drains — long before anyone inside notices. We inspect, repair, and replace commercial roofs here in our own hometown, with membrane and metal systems matched to the building and its budget.',
      'Being based on Coronet Dr matters more on commercial work than anywhere else: when your facility springs a leak over inventory or equipment, we can have eyes on the roof fast, not next week. We work around your operating hours, keep the site clean and safe, and document conditions so you can plan capital expenses instead of absorbing emergencies. Licensing and insurance cover our commercial work the same as our residential, and maintenance visits book Monday through Saturday. Evaluations are free — call (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'commercial-roofing',
    metaDescription:
      'Commercial roofing in Chattanooga, TN — flat and low-slope systems for downtown and valley businesses, from a Dalton crew. (678) 348-0273.',
    intro: [
      'Downtown Chattanooga and the corridors radiating from it carry a deep stock of flat and low-slope commercial roofs — older buildings near the Tennessee River, retail strips, offices, and light industrial space across the valley. Heavy plateau rain finds every weakness in those systems: ponding areas that stretch membranes, drains that clog with a season of debris, seams and penetrations that open a little more each year. We maintain, repair, and replace them all.',
      'We serve Hamilton County commercial clients from our Dalton shop 30 miles south, licensed and insured in Tennessee, and we build service around uptime — night and weekend scheduling where operations demand it, and honest condition reports that separate must-fix from can-wait. Leak calls over occupied space jump the queue, because water above inventory does not wait on a quote cycle. If you manage one building or a portfolio, start with a free roof evaluation: (678) 348-0273, or book online Monday through Saturday.',
    ],
  },
  {
    citySlug: 'rome-ga',
    serviceSlug: 'commercial-roofing',
    metaDescription:
      'Commercial roofing in Rome, GA — repairs and replacements for downtown buildings, offices, and industrial space. Free evaluations. (678) 348-0273.',
    intro: [
      "Rome's commercial roofs split into two very different problems. The historic buildings downtown between the rivers carry older flat roofs with decades of patches, parapet walls that shed water badly, and drainage designed in another century. The newer offices, medical buildings, and industrial space around the city carry modern membranes that mostly need disciplined maintenance and honest repairs. We handle both, and we do not treat them the same.",
      'Floyd County weather gives commercial owners no slack — river-valley humidity works on every seam, and heavy rain events test drainage twice a season. We make the drive from Dalton weekly, provide photo-documented condition reports, and quote repairs and replacements you can take to a budget meeting. We coordinate around tenants and business hours, keeping access, safety, and noise on a plan everyone approved first. Whether you own the building or manage it for someone else, the evaluation costs nothing: (678) 348-0273 or book a time online.',
    ],
  },
  {
    citySlug: 'cleveland-tn',
    serviceSlug: 'commercial-roofing',
    metaDescription:
      'Commercial roofing in Cleveland, TN — industrial, retail, and office roof systems serviced by a licensed Dalton, GA crew. (678) 348-0273.',
    intro: [
      'Cleveland works for a living, and its roofline shows it — manufacturing plants, warehouses, retail centers, and office buildings across Bradley County, most under low-slope membrane or metal systems with real square footage. Roofs that size fail expensively when neglected and cheaply when watched, so our commercial program leans on inspection and maintenance: clearing drains, sealing penetrations, and catching seam failures while they are still line items instead of losses.',
      'When a system does reach end of life, we replace it with minimal disruption to your operation, staging work so production and customers keep moving. We are 27 miles away in Dalton, licensed and insured for Tennessee work, and one call reaches the same team every time — no regional office runaround. Every visit ends with a written condition summary you can file, forward, or budget against next quarter. Get a free, no-obligation evaluation of your building at (678) 348-0273 or through online booking.',
    ],
  },

  // ────────────────────────────────── siding ──────────────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'siding',
    metaDescription:
      'Siding replacement and repair in Dalton, GA — vinyl and fiber cement installed by the local crew on Coronet Dr. Free quotes. (678) 348-0273.',
    intro: [
      'Dalton siding fights a two-front war: hail and wind-blown debris off the I-75 storm track on one side, and the humid North Georgia summer on the other, which fades vinyl, feeds mildew on shaded walls, and rots any wood trim that loses its paint. We replace and repair siding across Whitfield County — vinyl for value, fiber cement for toughness — and we flash and seal the details, because siding fails at its edges long before it fails in the field.',
      'From carpet-era ranches that need a full refresh to older homes downtown where trim carpentry matters, we treat the wall like a system: house wrap, flashing, siding, and trim working together to keep water out. And since our shop is right here in town, service after the job is a phone call, not a mystery. Pairing siding with gutter or window work saves a mobilization, so ask about bundling. Free quotes and inspections at (678) 348-0273, Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'siding',
    metaDescription:
      'Siding installation and repair in Chattanooga, TN — fiber cement and vinyl for valley humidity and plateau storms. Free quotes. (678) 348-0273.',
    intro: [
      'Tennessee River humidity is hard on walls. Chattanooga siding grows mildew on the shady side, fades on the sunny side, and takes hail and wind-thrown debris every time a storm clears the plateau. We install and repair siding across Hamilton County — fiber cement where durability and fire resistance lead the list, quality vinyl where budget does — always with the water management details done right, because a pretty wall that leaks is just expensive rot.',
      'The city rewards contractors who can adapt: crisp modern profiles on newer builds in the suburbs, and careful, proportion-respecting work on the older homes near downtown and the North Shore where the wrong siding choice ruins a streetscape. Our crew comes up from Dalton, 30 miles south, licensed and insured in Tennessee. Isolated storm damage gets repaired too, with profiles matched so one wall does not advertise the insurance claim. Start with a free, no-obligation quote — (678) 348-0273 or book online.',
    ],
  },
  {
    citySlug: 'cleveland-tn',
    serviceSlug: 'siding',
    metaDescription:
      'Siding replacement in Cleveland, TN — storm-tough vinyl and fiber cement for Bradley County homes, from a Dalton crew. Call (678) 348-0273.',
    intro: [
      'Storms that run the valley through Bradley County do not stop at the roofline — they crack vinyl panels, drive rain behind loose laps, and sandblast the weather side of Cleveland homes with debris. We repair storm-damaged siding and replace tired siding outright, matching profiles where a repair makes sense and re-cladding whole elevations where it does not. Fiber cement earns its keep here; good vinyl still covers a lot of Bradley County honestly.',
      "New siding is also the moment to fix what is underneath: soft sheathing, missing house wrap, and trim that has been repainted one time too many. We handle those layers instead of covering them up, from downtown Cleveland's older homes to the subdivisions ringing the city. Color and profile samples come to your driveway instead of a showroom across town. The trip from our Dalton shop is 27 miles, and the estimate is free with no obligation attached — (678) 348-0273, or grab a time online.",
    ],
  },

  // ────────────────────────────────── gutters ──────────────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'gutters',
    metaDescription:
      'Seamless gutters in Dalton, GA — installation, repair, and guards from your local Coronet Dr crew. Free assessments. Call (678) 348-0273.',
    intro: [
      'North Georgia rain arrives in bulk — slow soakers in winter, violent downpours in spring — and Dalton gutters have to move all of it away from your foundation without help. Undersized or sagging gutters quietly cause the most expensive problems a Whitfield County house can have: washed-out landscaping, wet crawl spaces, and foundation settling. We install seamless gutters sized to your actual roof area, not whatever length of five-inch was on the trailer.',
      'We also repair and re-pitch existing runs, replace crushed downspouts, and install gutter guards that stand up to the leaf load our mature oaks and maples deliver every fall. As the crew based right here on Coronet Dr, we can usually look at a Dalton gutter problem within days. Where steep valleys concentrate runoff, we step up to six-inch runs and bigger downspouts without drama. The assessment is free and comes with no obligation — call (678) 348-0273 or book online, Monday through Saturday.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'gutters',
    metaDescription:
      'Seamless gutter installation and repair in Chattanooga, TN — sized for plateau downpours and steep rooflines. Free assessments. (678) 348-0273.',
    intro: [
      'When heavy rain trains off the Cumberland Plateau, Chattanooga roofs shed staggering volumes of water in minutes — and steep historic rooflines near downtown and the North Shore concentrate it into valleys that can overwhelm ordinary gutters entirely. We design gutter systems for how your specific roof actually drains: six-inch seamless runs and oversized downspouts where the math demands them, standard five-inch where it does not.',
      "Hamilton County's tree canopy adds the second problem, filling gutters until water sheets over the back edge and rots fascia boards from behind. We install guards that actually shed leaves and pine needles, and we repair the fascia damage clogged gutters leave behind. Our crew runs up from Dalton, licensed and insured in Tennessee. If the fascia behind your gutters has already gone soft, we replace the wood first — hanging new metal on rot just schedules the next failure. Free assessments, Monday through Saturday, 9 to 9 — (678) 348-0273 or book online.",
    ],
  },
  {
    citySlug: 'calhoun-ga',
    serviceSlug: 'gutters',
    metaDescription:
      'Seamless gutters in Calhoun, GA — installs, repairs, and guards from a Dalton crew 25 minutes away. Free gutter assessments. (678) 348-0273.',
    intro: [
      'Plenty of Calhoun homes are still wearing their original builder gutters — thin-gauge, minimally sloped, and fastened with spikes that have worked loose after years of Gordon County downpours. When gutters pull away from the fascia or overflow at the corners, the water goes exactly where you do not want it: down the siding, into the crawl space, against the foundation. We replace those tired runs with seamless aluminum, hung with hidden hangers and pitched to actually drain.',
      'On the bigger ranch lots along US-41, long rooflines need thoughtful downspout placement to keep water from ganging up at one corner of the house — a detail we plan before we bend the first foot of metal. Guards, repairs, and full replacements all start the same way: a free assessment from our Dalton crew, 22 miles up the interstate. Most Calhoun gutter jobs get measured, bent, and hung inside a single day. Call (678) 348-0273 or schedule your visit online.',
    ],
  },

  // ────────────────────────────────── windows ──────────────────────────────────
  {
    citySlug: 'dalton-ga',
    serviceSlug: 'windows',
    metaDescription:
      'Replacement windows in Dalton, GA — energy-efficient installs by the local crew on Coronet Dr. Free consultations. Call (678) 348-0273.',
    intro: [
      'If your Dalton summer power bill climbs while a window unit fights a losing battle, your windows are probably part of the problem. A lot of Whitfield County housing — especially the ranches from the carpet-boom decades — still carries single-pane or early double-pane units that leak air year-round and fog up when their seals fail. We replace them with energy-efficient vinyl windows built for the North Georgia climate: low-E glass against the summer sun, tight frames against the winter drafts.',
      'Installation is where window projects live or die, so we square, shim, flash, insulate, and seal every opening instead of foaming a unit into a crooked hole and calling it done. Being based on Coronet Dr, we measure in person and stand behind the work in person. One window or the whole house, the process is the same careful one. Consultations are free and carry no obligation — (678) 348-0273, or book online Monday through Saturday, 9 to 9.',
    ],
  },
  {
    citySlug: 'chattanooga-tn',
    serviceSlug: 'windows',
    metaDescription:
      'Window replacement in Chattanooga, TN — efficient, storm-ready windows installed by a licensed Dalton, GA crew. Free consultations. (678) 348-0273.',
    intro: [
      'Chattanooga asks a lot of a window: Tennessee Valley humidity that exposes every failed seal as permanent fog, plateau storms that fling debris, summer sun off the river, and — in the older homes near downtown and the North Shore — architecture that deserves better than a builder-grade white rectangle. We replace windows across Hamilton County with efficient units matched to the house, including profiles and grid patterns that respect historic streetscapes.',
      'Every install gets the full treatment: openings squared and flashed, gaps insulated, exteriors sealed against wind-driven rain, because the best glass in the world cannot fix a leaky installation. You will feel the difference in the rooms that used to be the hot ones. Our crew is 30 miles away in Dalton and licensed and insured in Tennessee. Most window projects here wrap in a day or two, and the old units leave with us. Book a free, no-obligation consultation at (678) 348-0273 or online.',
    ],
  },
];

export const cityServices: CityService[] = raw.map((c) => CityServiceSchema.parse(c));

export function getCityServices(citySlug: string): CityService[] {
  return cityServices.filter((cs) => cs.citySlug === citySlug);
}

export function getCityService(citySlug: string, serviceSlug: string): CityService | undefined {
  return cityServices.find((cs) => cs.citySlug === citySlug && cs.serviceSlug === serviceSlug);
}
