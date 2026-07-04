// Name fragments for procedural generation. Players get first+last names;
// schools are assembled from place fragments + institution patterns +
// mascots (M3 world gen uses the full set; exhibitions sample from it too).

export const FIRST_NAMES = [
  'Aiden', 'Alex', 'Andre', 'Angel', 'Austin', 'Beau', 'Bennett', 'Blake', 'Brady', 'Brandon',
  'Brayden', 'Brooks', 'Bryce', 'Caleb', 'Cam', 'Carlos', 'Carson', 'Carter', 'Cash', 'Chase',
  'Chris', 'Cole', 'Colt', 'Connor', 'Cooper', 'Cruz', 'Dallas', 'Damon', 'Dante', 'Deacon',
  'Derek', 'Devin', 'Diego', 'Dominic', 'Drew', 'Dylan', 'Eli', 'Emmett', 'Ethan', 'Evan',
  'Felix', 'Finn', 'Gabe', 'Gavin', 'Grant', 'Grayson', 'Griffin', 'Hank', 'Hayes', 'Hudson',
  'Hunter', 'Ian', 'Isaiah', 'Jace', 'Jack', 'Jackson', 'Jaden', 'Jake', 'Jalen', 'Jamal',
  'James', 'Javier', 'Jaxon', 'Jesse', 'Joel', 'Jonah', 'Jordan', 'Josiah', 'Juan', 'Judd',
  'Kai', 'Kellen', 'Kendrick', 'Kobe', 'Kyle', 'Landon', 'Levi', 'Liam', 'Logan', 'Luis',
  'Luke', 'Marcus', 'Mason', 'Mateo', 'Max', 'Micah', 'Miles', 'Nash', 'Nate', 'Nico',
  'Noah', 'Nolan', 'Omar', 'Owen', 'Parker', 'Paxton', 'Preston', 'Quinn', 'Rafael', 'Reed',
  'Reese', 'Ricky', 'Rowan', 'Ryder', 'Sam', 'Sawyer', 'Seth', 'Silas', 'Tanner', 'Tate',
  'Theo', 'Trace', 'Trent', 'Trevor', 'Tucker', 'Ty', 'Tyler', 'Victor', 'Wade', 'Walker',
  'Wes', 'Weston', 'Wyatt', 'Xavier', 'Zach', 'Zane',
] as const

export const LAST_NAMES = [
  'Abbott', 'Acosta', 'Adair', 'Alvarez', 'Anders', 'Archer', 'Ashford', 'Atwater', 'Bailey', 'Banks',
  'Barlow', 'Barnes', 'Bautista', 'Baxter', 'Beckett', 'Bellamy', 'Benson', 'Blackwood', 'Boone', 'Bowden',
  'Boyd', 'Bradshaw', 'Brennan', 'Briggs', 'Buckley', 'Burgess', 'Cabrera', 'Calloway', 'Camden', 'Cardenas',
  'Carmichael', 'Carrillo', 'Carver', 'Castillo', 'Chandler', 'Chavez', 'Coleman', 'Colvin', 'Conway', 'Cortez',
  'Crawford', 'Crosby', 'Cullen', 'Dalton', 'Dawson', 'Delgado', 'Denton', 'Dickerson', 'Donovan', 'Draper',
  'Dudley', 'Duncan', 'Easton', 'Ellison', 'Emerson', 'Escobar', 'Fairbanks', 'Farley', 'Fenwick', 'Fields',
  'Finley', 'Fleming', 'Foley', 'Franco', 'Frost', 'Fuentes', 'Gallagher', 'Galloway', 'Gentry', 'Gibbs',
  'Godfrey', 'Granger', 'Greer', 'Guerrero', 'Gutierrez', 'Hale', 'Hammond', 'Harlow', 'Hartley', 'Hawkins',
  'Hayward', 'Henderson', 'Herrera', 'Hobbs', 'Holloway', 'Hopkins', 'Hutchins', 'Ibarra', 'Ingram', 'Irving',
  'Jacobs', 'Jarvis', 'Jimenez', 'Keating', 'Keller', 'Kendall', 'Kerr', 'Kirby', 'Knox', 'Lambert',
  'Landry', 'Larkin', 'Lawson', 'Ledger', 'Lockhart', 'Lozano', 'Lynch', 'Maddox', 'Marsh', 'Mathis',
  'McAllister', 'McBride', 'McCoy', 'McDowell', 'Mejia', 'Mercer', 'Miranda', 'Monroe', 'Montgomery', 'Morales',
  'Moreno', 'Navarro', 'Newsome', 'Nickerson', 'Nolan', 'Nunez', 'Ochoa', 'Odell', 'Ortega', 'Osborne',
  'Pacheco', 'Palmer', 'Parrish', 'Paxton', 'Pemberton', 'Pena', 'Pickett', 'Porter', 'Prescott', 'Quimby',
  'Ramsey', 'Randall', 'Redding', 'Reyes', 'Rhodes', 'Riggins', 'Rios', 'Roark', 'Rojas', 'Rollins',
  'Rosales', 'Rutledge', 'Salazar', 'Sanders', 'Santana', 'Sheffield', 'Shepard', 'Sloan', 'Solis', 'Stafford',
  'Stanton', 'Sterling', 'Stokes', 'Sutton', 'Talbot', 'Tate', 'Thatcher', 'Tillman', 'Trujillo', 'Vance',
  'Vargas', 'Vaughn', 'Velez', 'Wagner', 'Walsh', 'Warfield', 'Watkins', 'Webb', 'Whitaker', 'Whitfield',
  'Wilcox', 'Winslow', 'Wolfe', 'Woodard', 'Wray', 'Yates', 'York', 'Zavala',
] as const

/** Place-name fragments for fictional schools (no real universities). */
export const PLACE_FRAGMENTS = [
  'Alder', 'Bay', 'Beacon', 'Big Sky', 'Black Rock', 'Blue Ridge', 'Boulder', 'Brook', 'Canyon', 'Cape',
  'Cedar', 'Clear', 'Copper', 'Coral', 'Cotton', 'Crescent', 'Cypress', 'Delta', 'Dune', 'Eagle',
  'East', 'Elk', 'Ember', 'Fair', 'Falcon', 'Flint', 'Fox', 'Golden', 'Granite', 'Gulf',
  'Harbor', 'Haven', 'High', 'Hill', 'Iron', 'Juniper', 'Lake', 'Laurel', 'Liberty', 'Lone Star',
  'Maple', 'Meadow', 'Mesa', 'Mill', 'North', 'Oak', 'Ocean', 'Palm', 'Pine', 'Port',
  'Prairie', 'Red River', 'Ridge', 'River', 'Rock', 'Salt', 'Sand', 'Sierra', 'Silver', 'Smoky',
  'South', 'Spring', 'Stone', 'Summit', 'Sun', 'Timber', 'Valley', 'West', 'Willow', 'Wind',
] as const

export const PLACE_SUFFIXES = [
  'brook', 'burg', 'crest', 'dale', 'field', 'ford', 'gate', 'haven', 'land', 'mont',
  'more', 'point', 'port', 'ridge', 'shore', 'side', 'ton', 'view', 'ville', 'wood',
] as const

/** Institution patterns; {P} = place name. */
export const SCHOOL_PATTERNS = [
  '{P} State',
  '{P} Tech',
  '{P} A&M',
  'University of {P}',
  '{P} University',
  '{P} College',
] as const

export const MASCOTS = [
  'Aviators', 'Badgers', 'Bandits', 'Barons', 'Bears', 'Bisons', 'Blazers', 'Bobcats', 'Broncos', 'Bulls',
  'Captains', 'Cardinals', 'Catamounts', 'Chargers', 'Comets', 'Cougars', 'Coyotes', 'Cyclones', 'Drifters', 'Dust Devils',
  'Eagles', 'Explorers', 'Falcons', 'Firebirds', 'Foxes', 'Gators', 'Generals', 'Gladiators', 'Golden Hawks', 'Grizzlies',
  'Gulls', 'Hammers', 'Hawks', 'Herons', 'Hornets', 'Huskies', 'Jackals', 'Jackrabbits', 'Knights', 'Lancers',
  'Lions', 'Lobos', 'Longhorns', 'Lumberjacks', 'Mariners', 'Marlins', 'Mavericks', 'Miners', 'Monarchs', 'Moose',
  'Mountaineers', 'Mustangs', 'Night Owls', 'Otters', 'Outlaws', 'Panthers', 'Pioneers', 'Pirates', 'Prospectors', 'Raiders',
  'Rams', 'Rangers', 'Rapids', 'Rattlers', 'Ravens', 'Redtails', 'Rivercats', 'Roadrunners', 'Rockets', 'Roughnecks',
  'Sailfish', 'Scorpions', 'Senators', 'Sentinels', 'Sharks', 'Spartans', 'Stallions', 'Stampede', 'Storm', 'Sun Devils',
  'Terriers', 'Thunder', 'Thunderbirds', 'Titans', 'Tornadoes', 'Trailblazers', 'Tritons', 'Vikings', 'Voyagers', 'Wildcats',
  'Wolfpack', 'Wolverines', 'Wranglers', 'Yellowjackets',
] as const

export const TEAM_COLORS = [
  { primary: '#7f1d1d', secondary: '#fbbf24' },
  { primary: '#1e3a8a', secondary: '#f8fafc' },
  { primary: '#14532d', secondary: '#fde047' },
  { primary: '#581c87', secondary: '#e5e7eb' },
  { primary: '#9a3412', secondary: '#1c1917' },
  { primary: '#0c4a6e', secondary: '#fb923c' },
  { primary: '#701a75', secondary: '#fef08a' },
  { primary: '#166534', secondary: '#f8fafc' },
  { primary: '#b91c1c', secondary: '#e5e7eb' },
  { primary: '#1e40af', secondary: '#fbbf24' },
  { primary: '#0f766e', secondary: '#fef9c3' },
  { primary: '#a16207', secondary: '#1c1917' },
  { primary: '#3730a3', secondary: '#fda4af' },
  { primary: '#831843', secondary: '#f8fafc' },
  { primary: '#374151', secondary: '#f59e0b' },
  { primary: '#065f46', secondary: '#fca5a5' },
] as const
