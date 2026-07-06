import { FaqSchema, type Faq } from './types';

/**
 * Site-wide FAQs shown on the homepage / contact page. Each entry is parsed
 * through FaqSchema at import time so a bad answer fails the build.
 */
const raw: Faq[] = [
  {
    q: 'What happens during the free inspection?',
    a: 'One of our local team members comes out, gets on the roof, and looks at everything — shingles, flashing, gutters, and any trouble spots you have noticed. We take photos so you can see what we see, then walk you through it in plain English. Most inspections take under an hour.',
  },
  {
    q: 'Is the inspection really free, with no obligation?',
    a: 'Yes on both counts. You get an honest assessment and photos of what we found, and then the decision is entirely yours. If your roof is fine, we will tell you it is fine. No pressure, no follow-up hounding.',
  },
  {
    q: 'Do you help with insurance claims?',
    a: 'We do. If a storm damaged your roof, siding, gutters, or windows, we document everything with photos, can meet the adjuster on site, and help you understand the process. The claim is yours, but you will not be figuring it out alone.',
  },
  {
    q: 'Do you offer financing?',
    a: 'Ask us about options when we come out for your inspection. We know a roof is a big expense, and we will talk through ways to make the numbers work for your situation.',
  },
  {
    q: 'How fast can you start?',
    a: 'Inspections are usually quick to schedule — we are open Monday through Saturday, 9 AM to 9 PM. Project start dates depend on the season and the scope, but we will give you a real timeline up front and keep you posted if anything shifts.',
  },
  {
    q: 'Do you serve my area?',
    a: 'We are based in Dalton, GA and serve all of Northwest Georgia plus the Chattanooga, TN area. If you are anywhere in that stretch, we can be there. Not sure? Call us and ask — it takes thirty seconds to find out.',
  },
  {
    q: 'Do you handle both homes and commercial buildings?',
    a: 'Yes. We work on residential and commercial properties alike — roofs, siding, windows, and gutters. Same local crew, same straight answers, whether it is your house or your business.',
  },
  {
    q: 'Are you licensed and insured?',
    a: 'Yes. Southern Roofing & Exteriors is a licensed and insured, locally owned LLC based right here in Dalton. We are glad to provide documentation before any work begins.',
  },
  {
    q: 'How do I schedule an inspection?',
    a: 'Two easy ways: book online in under a minute, or call us at (678) 348-0273. We are open Monday through Saturday, 9 AM to 9 PM, and a real local person will help you pick a time.',
  },
  {
    q: 'What is your charity donation program?',
    a: 'A percentage of the proceeds from every job we complete goes to a charity — and you choose which one. It is our way of making sure every project gives something back to the community we all live in.',
  },
];

export const globalFaqs: Faq[] = raw.map((f) => FaqSchema.parse(f));
