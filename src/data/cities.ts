import { CitySchema, type City } from './types';

/**
 * The 12 cities Southern Roofing & Exteriors serves from the Dalton shop at
 * 1225 Coronet Dr. Every entry is parsed through CitySchema at import time,
 * so a thin or malformed city page fails the build instead of shipping.
 */
const raw: City[] = [
  {
    slug: 'dalton-ga',
    name: 'Dalton',
    state: 'GA',
    county: 'Whitfield',
    geo: { lat: 34.7698, lng: -84.9702 },
    distanceMiles: 0,
    metaDescription:
      'Roofing and exterior work in Dalton, GA from a locally owned crew based on Coronet Dr. Free inspections, straight answers. Call (678) 348-0273.',
    intro: [
      'Dalton is home base for us. Our shop sits at 1225 Coronet Dr, so when you book an inspection here, you are not waiting on a crew driving in from Atlanta or Chattanooga. We are already on your side of I-75, and we know Whitfield County roofs because we work under them every week.',
      "The Carpet Capital of the World has a little of everything on its rooftops. Older brick homes near the historic downtown, ranch houses from the mill-boom decades, and newer subdivisions pushing out toward the county line. Each one ages differently, and each one takes spring hail and summer storms in its own way.",
      'We are a locally owned LLC, licensed and insured, and we keep the schedule wide open — Monday through Saturday, 9 to 9. Book a free, no-obligation inspection online or call (678) 348-0273, and a portion of the proceeds goes to a charity you pick.',
    ],
    localFacts: {
      landmarks: ['the Carpet Capital of the World', 'the I-75 corridor', 'historic downtown Dalton'],
      weatherRisks: [
        'spring hailstorms along the I-75 corridor',
        'severe thunderstorms with straight-line winds',
        'humid summers that feed algae streaks on shingles',
      ],
      housingStock:
        'A mix of older brick homes near downtown, mid-century ranch houses from the carpet-mill era, and newer subdivisions spreading toward the Whitfield County line.',
    },
  },
  {
    slug: 'calhoun-ga',
    name: 'Calhoun',
    state: 'GA',
    county: 'Gordon',
    geo: { lat: 34.5023, lng: -84.9511 },
    distanceMiles: 22,
    metaDescription:
      'Calhoun, GA roofing and exteriors from a Dalton-based crew about 25 minutes up I-75. Free no-obligation inspections, Mon-Sat 9-9. (678) 348-0273.',
    intro: [
      'Calhoun is a quick run for us — about 22 miles straight down I-75 from our Dalton shop, one county over in Gordon. We can usually be on a Calhoun roof the same week you call, and often a lot sooner when a storm has just rolled through.',
      'The Gordon County seat has grown fast along the interstate, and its housing shows it: solid older homes near the downtown square, ranch houses on big lots along US-41, and newer builds filling in around the exits. Fast growth also means some roofs went on quickly, and we see the shortcuts up close.',
      'We are licensed, insured, and locally owned, and every job starts with a free inspection — no pressure, no obligation. Book online or call (678) 348-0273 any day but Sunday, 9 a.m. to 9 p.m.',
    ],
    localFacts: {
      landmarks: ['the Gordon County seat', 'I-75 and US-41', 'downtown Calhoun'],
      weatherRisks: [
        'hail cells tracking the I-75 corridor in spring',
        'straight-line winds from severe thunderstorms',
        'heavy rain events that expose weak flashing and valleys',
      ],
      housingStock:
        'Established homes around the downtown square, ranch houses on generous lots along US-41, and newer subdivisions built during the growth along the interstate exits.',
    },
  },
  {
    slug: 'chatsworth-ga',
    name: 'Chatsworth',
    state: 'GA',
    county: 'Murray',
    geo: { lat: 34.7659, lng: -84.7699 },
    distanceMiles: 12,
    metaDescription:
      'Chatsworth, GA roof and exterior help from your neighbors in Dalton, 12 miles west. Free inspections, honest scopes, Mon-Sat 9-9. (678) 348-0273.',
    intro: [
      'Chatsworth sits just 12 miles east of our Dalton shop, a short drive out Highway 52 toward the mountains. Murray County is practically our backyard, and the foothills of the Cohuttas make for some of the prettiest — and windiest — rooflines we work on.',
      'Homes here range from older houses near the Murray County courthouse to ranch homes and manufactured housing on acreage, plus newer builds creeping up toward Fort Mountain. Elevation matters: roofs closer to the mountains catch more wind, more falling limbs, and the occasional icy morning the valley never sees.',
      'We are a locally owned, licensed and insured LLC, and we give Chatsworth the same free, no-obligation inspection we give our Dalton neighbors. Call (678) 348-0273 or book online, Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the foothills of the Cohutta Mountains', 'Fort Mountain State Park nearby', 'the Murray County seat'],
      weatherRisks: [
        'gusty winds coming off the Cohutta foothills',
        'falling limbs from mature trees on wooded lots',
        'spring hail and severe thunderstorms',
        'occasional ice at higher elevations',
      ],
      housingStock:
        'Older homes near the courthouse square, ranch and manufactured homes on rural acreage, and newer construction working its way up the wooded slopes toward Fort Mountain.',
    },
  },
  {
    slug: 'ringgold-ga',
    name: 'Ringgold',
    state: 'GA',
    county: 'Catoosa',
    geo: { lat: 34.9162, lng: -85.1094 },
    distanceMiles: 17,
    metaDescription:
      'Ringgold, GA roofing from a Dalton crew 17 miles down I-75. Storm checks, honest repairs, free no-obligation inspections. Call (678) 348-0273.',
    intro: [
      'Ringgold is about 17 miles up I-75 from our shop — twenty-some minutes door to door. Catoosa County sits square in the path of the storm systems that ride the interstate corridor northeast, so when hail hits, Ringgold usually knows it before we do.',
      "This is a town that understands severe weather. Folks here still talk about the 2011 tornado, and the historic depot downtown has stood through more than most buildings ever will. The housing runs from older homes near US-41 through town to newer subdivisions spreading along the ridges toward the Tennessee line.",
      'When a storm rolls through, you want a local, licensed, insured crew — not a truck with out-of-state plates. Book a free inspection online or call (678) 348-0273. We answer Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the historic Ringgold depot', 'I-75 and US-41', 'Catoosa County ridges near the Tennessee line'],
      weatherRisks: [
        'hail corridors tracking I-75 in spring',
        'tornado and straight-line wind history, including the 2011 tornado',
        'severe thunderstorms and heavy rain',
      ],
      housingStock:
        'Older homes along the US-41 corridor through town, established neighborhoods near the depot, and newer subdivisions built on the ridges as Catoosa County has grown.',
    },
  },
  {
    slug: 'fort-oglethorpe-ga',
    name: 'Fort Oglethorpe',
    state: 'GA',
    county: 'Catoosa',
    geo: { lat: 34.949, lng: -85.2569 },
    distanceMiles: 25,
    metaDescription:
      'Fort Oglethorpe, GA roofing and exteriors from a licensed Dalton crew about 25 miles away. Free inspections, Mon-Sat 9-9. Call (678) 348-0273.',
    intro: [
      'Fort Oglethorpe sits about 25 miles northwest of our Dalton shop, right against the Tennessee line and next door to the Chickamauga Battlefield. It is an easy run up I-75 and across Battlefield Parkway, and we are up there often enough to know the streets without a map.',
      'The town grew up around the old Army post, and a lot of its housing dates to the postwar decades — brick ranches and modest single-story homes on flat lots, with newer builds filling in along the parkway. Flat, open ground means wind gets a clean shot at shingles here, and hail off the plateau does the rest.',
      'We are locally owned, licensed and insured, and the inspection is always free with no strings attached. Call (678) 348-0273 or book online, any Monday through Saturday between 9 and 9.',
    ],
    localFacts: {
      landmarks: ['Chickamauga Battlefield (Chickamauga and Chattanooga National Military Park)', 'Battlefield Parkway', 'the Georgia-Tennessee state line'],
      weatherRisks: [
        'wind-driven storms crossing the open valley floor',
        'spring hail moving off the Cumberland Plateau',
        'heavy rain and humid summers that streak shingles',
      ],
      housingStock:
        'Postwar brick ranches and modest single-story homes on flat lots around the old post, with newer construction filling in along Battlefield Parkway.',
    },
  },
  {
    slug: 'lafayette-ga',
    name: 'LaFayette',
    state: 'GA',
    county: 'Walker',
    geo: { lat: 34.7098, lng: -85.2816 },
    distanceMiles: 26,
    metaDescription:
      'LaFayette, GA roofing help from a Dalton-based, licensed and insured crew 26 miles east. Free no-obligation inspections. Call (678) 348-0273.',
    intro: [
      'LaFayette is about 26 miles west of our Dalton shop, over the ridges on Highway 136. The Walker County seat sits in the valley between Pigeon Mountain and Taylor Ridge, and that geography shapes every roof in town — wind funnels through the gaps, and storms stall against the mountains.',
      'The housing here is honest, working-town stock: older homes around the courthouse square, brick ranches from the mid-1900s, and farmhouses on the county roads heading toward the mountain. Many of these roofs have been patched more than once, and we can usually tell you quickly whether the next fix should be a repair or a replacement.',
      'We treat Walker County like home turf. The inspection is free, the scope is honest, and we are reachable Monday through Saturday, 9 to 9, at (678) 348-0273 or through online booking.',
    ],
    localFacts: {
      landmarks: ['the Walker County seat', 'Pigeon Mountain and Taylor Ridge', 'US-27 through town'],
      weatherRisks: [
        'wind funneling through the valley between the ridges',
        'severe thunderstorms stalling against the mountains',
        'spring hail and heavy rain',
      ],
      housingStock:
        'Older homes around the courthouse square, mid-century brick ranches, and farmhouses on county roads running toward Pigeon Mountain.',
    },
  },
  {
    slug: 'rome-ga',
    name: 'Rome',
    state: 'GA',
    county: 'Floyd',
    geo: { lat: 34.257, lng: -85.1647 },
    distanceMiles: 40,
    metaDescription:
      'Rome, GA roofing and exteriors from a Dalton crew that makes the 40-mile run weekly. Free inspections, real answers, Mon-Sat 9-9. (678) 348-0273.',
    intro: [
      'Rome is the far corner of our Georgia routes — about 40 miles southwest of the Dalton shop, an hour down US-411 and Highway 53. We make the drive because Floyd County keeps us busy: three rivers, a lot of trees, and a lot of roofs with real age on them.',
      'Where the Etowah and Oostanaula meet to form the Coosa, you get a city with genuine history and the housing to match. Between the Ridge and Valley terrain and the mature hardwoods, Rome roofs deal with heavy rain runoff, falling limbs, and humidity that streaks north-facing slopes green.',
      'We are licensed, insured, and locally owned out of Dalton, and Rome jobs get the same free, no-obligation inspection as everyone else. Book online or call (678) 348-0273, Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the three rivers — Etowah, Oostanaula, and Coosa', 'Berry College', 'historic downtown Rome'],
      weatherRisks: [
        'heavy rain and runoff in the river valleys',
        'falling limbs from mature hardwoods',
        'severe spring thunderstorms and hail',
        'humid summers that promote shingle algae',
      ],
      housingStock:
        'Historic homes in and around downtown, established mid-century neighborhoods, and newer subdivisions on the hills outside the river valleys.',
    },
  },
  {
    slug: 'cartersville-ga',
    name: 'Cartersville',
    state: 'GA',
    county: 'Bartow',
    geo: { lat: 34.1651, lng: -84.801 },
    distanceMiles: 45,
    metaDescription:
      'Cartersville, GA roofing from a licensed Dalton crew 45 miles up I-75. Free no-obligation inspections, honest pricing. Call (678) 348-0273.',
    intro: [
      'Cartersville marks the southern end of our service area — 45 miles down I-75 from Dalton, about 45 minutes when the interstate behaves. Bartow County has boomed as metro Atlanta pushes north, and that boom is written all over its rooftops.',
      'You see it in the mix: a historic downtown with older homes that deserve careful work, lake-adjacent houses out toward Allatoona, and street after street of newer subdivisions where builder-grade shingles are hitting the end of their first life all at once. Spring hail along the interstate does not help.',
      'If your Cartersville roof is due for a look, we will make the drive and tell you the truth about it. Free inspection, no obligation — book online or call (678) 348-0273, Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the I-75 corridor', 'Lake Allatoona proximity', 'historic downtown Cartersville'],
      weatherRisks: [
        'spring hail along the I-75 corridor',
        'severe thunderstorms with damaging straight-line winds',
        'humid summers that age and streak asphalt shingles',
      ],
      housingStock:
        'Older homes in the historic downtown, houses near Lake Allatoona, and large tracts of newer subdivisions built during the growth up the I-75 corridor.',
    },
  },
  {
    slug: 'ellijay-ga',
    name: 'Ellijay',
    state: 'GA',
    county: 'Gilmer',
    geo: { lat: 34.6948, lng: -84.4822 },
    distanceMiles: 34,
    metaDescription:
      'Ellijay, GA roofing for mountain homes and cabins from a Dalton crew 34 miles west. Free inspections, metal and shingle work. (678) 348-0273.',
    intro: [
      'Ellijay is 34 miles east of our Dalton shop, up and over on Highway 52 through some of the best scenery in North Georgia. Gilmer County is apple country and cabin country, and both mean roofs that work harder than their valley cousins.',
      'Mountain elevation changes the job. Cabins and homes up in the hollows around the orchards take more wind, more falling limbs, more ice on cold mornings, and faster freeze-thaw swings than anything down in Dalton. Metal roofs are common here for good reason, and we work on both metal and shingle.',
      'Whether it is a full-time home or a cabin you rent out, we will climb up, look it over for free, and give you a straight answer. Call (678) 348-0273 or book online — Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the apple orchards of Gilmer County', 'the North Georgia mountains', 'Highway 52 toward Fort Mountain'],
      weatherRisks: [
        'higher-elevation wind exposure',
        'falling limbs from heavily wooded lots',
        'occasional ice and faster freeze-thaw cycles',
        'severe thunderstorms rolling over the ridges',
      ],
      housingStock:
        'Mountain cabins and chalets on wooded slopes, homes near the orchards and river, and traditional houses in and around downtown Ellijay.',
    },
  },
  {
    slug: 'chattanooga-tn',
    name: 'Chattanooga',
    state: 'TN',
    county: 'Hamilton',
    geo: { lat: 35.0456, lng: -85.3097 },
    distanceMiles: 30,
    metaDescription:
      'Chattanooga roofing and exteriors from a Dalton, GA crew 30 miles south. Residential and commercial. Free inspections, Mon-Sat 9-9. (678) 348-0273.',
    intro: [
      'Chattanooga is a 30-mile shot up I-75 and I-24 from our Dalton shop — close enough that we treat Hamilton County as a second home market. From the foot of Lookout Mountain to the neighborhoods along the Tennessee River, we cover the whole Scenic City, residential and commercial alike.',
      'Chattanooga roofs are a study in contrast. Historic homes near downtown and the North Shore carry steep, complicated rooflines, while the commercial stock downtown runs flat and low-slope. Storms coming off the plateau hit both, and river-valley humidity streaks shingles all summer long.',
      'We are a licensed and insured LLC, locally owned, with crews available Monday through Saturday, 9 to 9. Book a free, no-obligation inspection online or call (678) 348-0273 — and a share of the proceeds goes to a charity you choose.',
    ],
    localFacts: {
      landmarks: ['Lookout Mountain', 'the Tennessee River', 'downtown Chattanooga and the North Shore'],
      weatherRisks: [
        'severe storms coming off the Cumberland Plateau',
        'straight-line winds and spring hail',
        'river-valley humidity that feeds shingle algae streaks',
        'heavy rain events stressing flat and low-slope roofs',
      ],
      housingStock:
        'Historic homes with steep rooflines near downtown and the North Shore, mid-century neighborhoods in the valley, newer suburban builds, and a large stock of flat and low-slope commercial buildings.',
    },
  },
  {
    slug: 'ooltewah-tn',
    name: 'Ooltewah',
    state: 'TN',
    county: 'Hamilton',
    geo: { lat: 35.0687, lng: -85.0644 },
    distanceMiles: 26,
    metaDescription:
      'Ooltewah, TN roofing from a Dalton, GA crew about 26 miles south via I-75. Free no-obligation inspections, licensed and insured. (678) 348-0273.',
    intro: [
      'Ooltewah sits about 26 miles from our Dalton shop, straight up I-75 past the state line — often a faster drive for us than parts of our own county. This corner of Hamilton County, alongside neighboring Collegedale, has grown as fast as anywhere we serve.',
      'That growth shapes the work. Much of Ooltewah is newer construction — subdivisions built in the last couple of decades, where entire streets got the same builder-grade shingles in the same year and now age on the same clock. When a hail cell tracks the interstate, whole neighborhoods need honest eyes at once.',
      'We are licensed, insured, and locally owned, and we do not do storm-chaser pressure. Get a free inspection on your schedule — book online or call (678) 348-0273, Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the Collegedale area', 'the I-75 corridor north of the Georgia line', 'White Oak Mountain'],
      weatherRisks: [
        'hail cells tracking the I-75 corridor',
        'severe thunderstorms with damaging winds',
        'humid Tennessee Valley summers streaking shingles',
      ],
      housingStock:
        'Predominantly newer subdivisions from the last two decades of growth, alongside established homes on larger lots near White Oak Mountain and the Collegedale area.',
    },
  },
  {
    slug: 'cleveland-tn',
    name: 'Cleveland',
    state: 'TN',
    county: 'Bradley',
    geo: { lat: 35.1595, lng: -84.8766 },
    distanceMiles: 27,
    metaDescription:
      'Cleveland, TN roofing and exteriors — residential and commercial — from a Dalton, GA crew 27 miles south. Free inspections. Call (678) 348-0273.',
    intro: [
      'Cleveland is about 27 miles north of our Dalton shop up I-75 and US-64 — the Bradley County seat and the gateway to the Ocoee region. It is one of our most frequent Tennessee stops, for houses and for the industrial and commercial buildings the city is known for.',
      'Bradley County weather does not go easy on roofs. Storm systems ride the valley northeast, dropping hail and pushing straight-line winds across town, and the humid summers streak shingles on every north-facing slope. Homes here run from historic houses near downtown to ranches and newer subdivisions ringing the city.',
      'We are a locally owned LLC, licensed and insured on both sides of the state line. Book a free, no-obligation inspection online or call (678) 348-0273 — we work Monday through Saturday, 9 to 9.',
    ],
    localFacts: {
      landmarks: ['the Bradley County seat', 'the gateway to the Ocoee region', 'I-75 and US-64'],
      weatherRisks: [
        'storm systems riding the valley with hail and straight-line winds',
        'heavy rain and severe spring thunderstorms',
        'humid summers driving algae streaks on shingles',
      ],
      housingStock:
        'Historic homes near downtown Cleveland, mid-century ranches, newer subdivisions on the edges of town, and a substantial stock of commercial and industrial buildings.',
    },
  },
];

export const cities: City[] = raw.map((c) => CitySchema.parse(c));

export function getCity(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}
