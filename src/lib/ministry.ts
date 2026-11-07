/**
 * Launch copy for the history, biography and impact pages, used until the communications team
 * fills the matching CMS entries (the CMS always wins). Sources, so the team can check them:
 *
 *   dunamisgospel.org: /the-genesis (founding account), /about-us, /the-mandate, /the-vision,
 *     /the-mission, /the-goal, /welfare, /the-leadership, /contact-us, homepage counters (branches,
 *     home churches, conferences).
 *   Press: Wikipedia (Glory Dome dates, Gana Ropp), PM News 2018, Premium Times 2023 (KPG and IMFFC nations),
 *     Periscope 2025 (Flaming Fire, over 68 nations; another report says 71), Leadership 2025 (109 countries,
 *     scholarships) and 2026 (Kogi and Benue outreach), TheWill 2023 (honorary doctorate).
 *
 * Branch figure: dunamisgospel.org/locate-a-branch had 861 entries on 3 November 2026. Without 36
 * repeats and one test entry that is 824 places, 8 of them viewing centres. The church's homepage
 * counter still says 580+. The site shows no branch number: Dr. Becky asked for "branches all over Nigeria and
 * around the world" instead. The Glory Dome is a 100,000-capacity sanctuary, never "seats".
 */

import type { glass } from '@/assets/glass'

export type GlassKey = keyof typeof glass

export type FaqEntry = { question: string; answer: string }

export const defaultFaqs: FaqEntry[] = [
  {
    question: 'When and where is the anniversary?',
    answer: '23 to 29 November 2026, at the Glory Dome, Lord’s Garden, Airport Road, Abuja.',
  },
  {
    question: 'Do I need to register?',
    answer: 'No. Just come. If you want to tell your friends, you can make an I Am Attending card and share it.',
  },
  {
    question: 'I’m coming from outside Nigeria. Can you help with pickup or accommodation?',
    answer: 'Fill the International Guests form and tell us what you need. The form isn’t a confirmation, so please wait to hear from our logistics team before you rely on it.',
  },
  {
    question: 'What is Kingdom Power & Glory?',
    answer: 'Our yearly anniversary conference. This year’s theme is Open Heavens.',
  },
  {
    question: 'How do I share my testimony or my story?',
    answer: 'Use the forms on the Testimonies and Sons of the Prophet pages. Our communications team reads each one before it goes up.',
  },
]

/** The FAQ, worded for whether the testimony form is switched on. */
export const faqsFor = (testimonyFormOpen: boolean): FaqEntry[] =>
  testimonyFormOpen
    ? defaultFaqs
    : defaultFaqs.map((faq) =>
        faq.question === 'How do I share my testimony or my story?'
          ? { ...faq, answer: 'We’re not taking new testimonies at the moment. You can still share your story on the Sons of the Prophet page, and our communications team reads each one before it goes up.' }
          : faq,
      )

/** The ministry's official wording, as supplied for this site. */
export const vision = {
  vision: 'The restoration of human destiny and dignity by the administration of the benefits of Redemption, through the ministry of the Word and the demonstration of power.',
  mission: 'To blanket this world with the evidence of God’s saving, healing, delivering and lifting power everywhere people live, work or play.',
  goal: 'To connect humanity with the Person, Presence, passion, purpose, potential, principles and power of the Almighty, releasing people to fulfil their earthly purpose and ultimately possess Heaven.',
}

export type DefaultMilestone = { key: string; art: GlassKey; date: string; title: string; text: string; photo?: string; label?: string }

export const defaultMilestones: DefaultMilestone[] = [
  {
    key: 'first-outreach',
    art: 'house',
    date: 'July 1996',
    title: 'The first outreach',
    text: 'The first outreach meeting is held in the banquet hall of the Agura Hotel. They leave their jobs and move to Abuja, and for 13 months home is one room in Zone 7.',
  },
  {
    key: 'founded',
    art: 'flame',
    date: '10 November 1996',
    title: 'Dunamis begins',
    text: 'Dunamis International Gospel Centre is founded in Abuja. The name is taken from Acts 1:8: dunamis is the Greek word for power.',
    photo: 'hands-raised',
  },
  {
    key: 'area-1',
    art: 'canopy',
    date: 'November 1997',
    title: 'Under canopies, then a 700-seater',
    text: 'A colleague offered land behind the old Federal Secretariat in Area 1 for temporary use. We worshipped under canopies for six weeks. By the first anniversary we had a 700-seat auditorium, with people still sitting outside.',
    photo: 'congregation-praise',
  },
  {
    key: 'growth',
    art: 'church',
    date: 'The Area 1 years',
    title: 'Room for 10,000',
    text: 'That auditorium was expanded twice, until it held more than 10,000 people. The Gospel Power Team took the message outdoors, to Eagle Square, the old parade ground and the national stadium.',
    photo: 'worship-tears',
  },
  {
    key: 'foundation',
    art: 'cross',
    date: '14 September 2014',
    title: 'Laying a new foundation',
    text: 'Work begins on a new home for the church, on the Lord’s Garden along Airport Road.',
    photo: 'dome-grounds',
  },
  {
    key: 'dome',
    art: 'dome',
    date: '24 November 2018',
    title: 'The Glory Dome is dedicated',
    text: 'The 100,000-capacity sanctuary is dedicated during Kingdom Power & Glory. It was finished without debt and without a bank loan.',
    photo: 'dome-interior-wide',
  },
  {
    key: 'nations',
    art: 'flag',
    date: '2023',
    title: 'The nations come',
    text: 'People from Nigeria and 53 other countries come for Kingdom Power & Glory. Ministers from 48 nations attend the Flaming Fire conference.',
    photo: 'nations-cameroon',
  },
  {
    key: 'pilgrims',
    art: 'plane',
    date: '2025',
    title: 'Visitors from 109 countries',
    text: 'Pilgrims from 109 countries visit the Glory Dome, and delegations from over 68 nations come for the Flaming Fire conference. The church also announces full university scholarships for orphans and members who can’t afford school.',
    photo: 'nations-crowd',
  },
  {
    key: 'medical',
    art: 'medical',
    date: 'February 2026',
    title: 'Free medical outreach',
    text: 'A team takes free medical care to communities in Kogi and Benue. Reports put the number of people reached at 5,000.',
    photo: 'medical-care',
  },
  {
    key: 'crusades',
    art: 'world',
    date: '2026',
    title: 'Crusades across the nations',
    text: 'This year the crusades have gone to Venezuela, Nicaragua, Argentina, Canada, Romania, Latvia, Cameroon, Angola, Lesotho and Zambia, with missions to Thailand, Cambodia and Indonesia, and to Madalla, Lagos and Enugu here in Nigeria.',
    photo: 'lesotho-prayer',
    label: 'Lesotho',
  },
  {
    key: 'thirty',
    art: 'thirty',
    date: '23 to 29 November 2026',
    title: 'Thirty years',
    text: 'We gather at the Glory Dome to say thank you.',
    photo: 'nations-celebration',
  },
]

export type DefaultStat = { value: number; suffix?: string; label: string; note?: string }

export const defaultStats: DefaultStat[] = [
  { value: 100000, label: 'Capacity of the Glory Dome', note: 'Finished without debt' },
  { value: 5000, suffix: '+', label: 'Home church locations', note: 'Fellowship in people’s homes' },
  { value: 45, suffix: '+', label: 'Conferences and crusades a year' },
  { value: 68, suffix: '+', label: 'Nations at Flaming Fire', note: 'In 2025' },
  { value: 109, label: 'Countries our visitors came from', note: 'In 2025' },
  { value: 30, label: 'Years', note: 'Since 10 November 1996' },
]

export type ContactDesk = {
  title: string
  text: string
  whatsapp?: string
  phone?: string
  email?: string
  link?: { href: string; label: string; external?: boolean }
}

/** Official numbers from dunamisgospel.org/contact-us, until Settings → Contacts & socials is filled. */
export const defaultContacts: ContactDesk[] = [
  {
    title: 'General enquiries',
    text: 'Anything about the anniversary, directions or the church.',
    whatsapp: '+234 903 498 6089',
  },
  {
    title: 'International guests',
    text: 'Need airport pickup or help with accommodation? Fill the form and our logistics team will get back to you. You can also message this line.',
    whatsapp: '+234 903 498 6089',
    link: { href: '/international', label: 'Fill the form' },
  },
  {
    title: 'Testimonies',
    text: 'Need help sharing your testimony or your story? Send it to the testimony line.',
    whatsapp: '+234 903 498 5552',
    link: { href: '/testimonies#share', label: 'Share your testimony' },
  },
]

/** Official accounts listed on dunamisgospel.org/contact-us. */
export const officialAccounts = [
  { name: 'Dunamis Worldwide', links: [
    { platform: 'youtube', url: 'https://www.youtube.com/@dunamistvworldwide' },
    { platform: 'facebook', url: 'https://www.facebook.com/DunamisGospelHqtrs' },
    { platform: 'instagram', url: 'https://www.instagram.com/dunamisgospel/' },
    { platform: 'x', url: 'https://x.com/dunamiswrldwide' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@dunamisintlgospelcentre' },
  ] },
  { name: 'Dr. Paul Enenche', links: [
    { platform: 'youtube', url: 'https://www.youtube.com/@DrPastorPaulEnenche' },
    { platform: 'facebook', url: 'https://www.facebook.com/drpastorpaulenenche' },
    { platform: 'instagram', url: 'https://www.instagram.com/drpastorpaulenenche' },
    { platform: 'x', url: 'https://x.com/drpaulenenche' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@drpstpaulenenche' },
  ] },
  { name: 'Dr. Becky Paul-Enenche', links: [
    { platform: 'youtube', url: 'https://www.youtube.com/@DrBeckyEnenche' },
    { platform: 'facebook', url: 'https://www.facebook.com/Drbeckyenenche' },
    { platform: 'instagram', url: 'https://www.instagram.com/drbeckyenenche' },
    { platform: 'x', url: 'https://x.com/drbeckyenenche' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@drbeckyenenche' },
  ] },
] as const

export const venueAddress = 'The Glory Dome, Lord’s Garden, Airport Road, Abuja'
export const directionsUrl = 'https://maps.app.goo.gl/K69JcTFUFJV4QkvF7'

export const whatsappLink = (number: string) => `https://wa.me/${number.replace(/\D/g, '')}`
