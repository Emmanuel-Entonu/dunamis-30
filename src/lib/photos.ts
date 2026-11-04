import type { StaticImageData } from 'next/image'

import altarCall from '@/assets/gallery/altar-call.webp'
import altarJoy from '@/assets/gallery/altar-joy.webp'
import atTheCross from '@/assets/gallery/at-the-cross.webp'
import childBlessing from '@/assets/gallery/child-blessing.webp'
import congregationPraise from '@/assets/gallery/congregation-praise.webp'
import delegatesFlags from '@/assets/gallery/delegates-flags.webp'
import domeCrowd from '@/assets/gallery/dome-crowd.webp'
import domeExterior from '@/assets/gallery/dome-exterior.webp'
import domeGrounds from '@/assets/gallery/dome-grounds.webp'
import domeInteriorWide from '@/assets/gallery/dome-interior-wide.webp'
import flagsCarpet from '@/assets/gallery/flags-carpet.webp'
import flagsLifted from '@/assets/gallery/flags-lifted.webp'
import frontRow from '@/assets/gallery/front-row.webp'
import guestsSeated from '@/assets/gallery/guests-seated.webp'
import handsLifted from '@/assets/gallery/hands-lifted.webp'
import handsRaised from '@/assets/gallery/hands-raised.webp'
import healingMinistry from '@/assets/gallery/healing-ministry.webp'
import inTheCongregation from '@/assets/gallery/in-the-congregation.webp'
import layingHands from '@/assets/gallery/laying-hands.webp'
import medicalCare from '@/assets/gallery/medical-care.webp'
import ministeringPrayer from '@/assets/gallery/ministering-prayer.webp'
import mountainDawn from '@/assets/gallery/mountain-dawn.webp'
import nationsCameroon from '@/assets/gallery/nations-cameroon.webp'
import nationsCelebration from '@/assets/gallery/nations-celebration.webp'
import nationsCrowd from '@/assets/gallery/nations-crowd.webp'
import nationsInThePews from '@/assets/gallery/nations-in-the-pews.webp'
import nationsProcession from '@/assets/gallery/nations-procession.webp'
import onTheAltar2 from '@/assets/gallery/on-the-altar-2.webp'
import praiseSinging from '@/assets/gallery/praise-singing.webp'
import prayerBlackWhite from '@/assets/gallery/prayer-black-white.webp'
import prayerLine from '@/assets/gallery/prayer-line.webp'
import prayerMoment from '@/assets/gallery/prayer-moment.webp'
import rejoicing from '@/assets/gallery/rejoicing.webp'
import saxophone from '@/assets/gallery/saxophone.webp'
import surrender from '@/assets/gallery/surrender.webp'
import walkingTogether from '@/assets/gallery/walking-together.webp'
import welcomingGuests from '@/assets/gallery/welcoming-guests.webp'
import welfareFood from '@/assets/gallery/welfare-food.webp'
import worshipCrowd from '@/assets/gallery/worship-crowd.webp'
import worshipEyesClosed from '@/assets/gallery/worship-eyes-closed.webp'
import worshipLeader from '@/assets/gallery/worship-leader.webp'
import worshipTears from '@/assets/gallery/worship-tears.webp'
import gloryDomeInterior from '@/assets/photos/glory-dome-interior.webp'
import pastorBecky from '@/assets/photos/pastor-becky.webp'
import pastorPaulPreaching from '@/assets/photos/pastor-paul-preaching.webp'
import pastorPaul from '@/assets/photos/pastor-paul.webp'
import seniorPastors from '@/assets/photos/senior-pastors.webp'
import anointingPoster from '@/assets/posters/anointing-service.webp'
import blessingPoster from '@/assets/posters/blessing-sunday.webp'
import healingPoster from '@/assets/posters/healing-deliverance.webp'
import impartationPoster from '@/assets/posters/impartation-service.webp'
import communionPoster from '@/assets/posters/power-communion.webp'
import thanksgivingPoster from '@/assets/posters/thanksgiving-service.webp'

/**
 * Official photographs (dunamisgospel.org). The CMS gallery replaces these once it has items.
 * The pastors' photos are from the church's YouTube channels, posted in early November 2026.
 */
export const photos = {
  altarCall,
  altarJoy,
  domeExterior,
  domeGrounds,
  domeInteriorWide,
  handsRaised,
  healingMinistry,
  medicalCare,
  ministeringPrayer,
  mountainDawn,
  nationsCameroon,
  nationsCelebration,
  nationsCrowd,
  nationsInThePews,
  pastorBecky,
  pastorPaul,
  pastorPaulPreaching,
  praiseSinging,
  prayerBlackWhite,
  seniorPastors,
  welfareFood,
  worshipEyesClosed,
  worshipTears,
}

export type PhotoKey = keyof typeof photos

/** Milestones refer to their photographs by asset file name. */
export const photoByFile: Record<string, StaticImageData> = {
  'hands-raised': handsRaised,
  'worship-eyes-closed': worshipEyesClosed,
  'worship-tears': worshipTears,
  'dome-grounds': domeGrounds,
  'nations-celebration': nationsCelebration,
  'nations-cameroon': nationsCameroon,
  'nations-crowd': nationsCrowd,
  'medical-care': medicalCare,
  'dome-interior-wide': domeInteriorWide,
}

export type GalleryEntry = { key: string; src: StaticImageData; title: string; category: string; event: string; year?: number }

/**
 * Launch gallery, sharpest photographs first. Scene captions only: the communications team can add
 * names, years and events from the CMS, where each item replaces this list.
 */
export const defaultGallery: GalleryEntry[] = [
  { key: 'exterior', src: domeExterior, title: 'The Glory Dome', category: 'expansion', event: 'The Glory Dome' },
  { key: 'wide', src: domeInteriorWide, title: 'Inside the Glory Dome', category: 'conventions', event: 'The Glory Dome' },
  { key: 'crowd', src: nationsCrowd, title: 'Carrying the flag in worship', category: 'international', event: 'Nations at Dunamis' },
  { key: 'eyes', src: worshipEyesClosed, title: 'Lost in worship', category: 'events', event: 'Glory Dome services' },
  { key: 'cameroon', src: nationsCameroon, title: 'The flag of Cameroon at the altar', category: 'international', event: 'Nations at Dunamis' },
  { key: 'tears', src: worshipTears, title: 'Tears in the presence of God', category: 'events', event: 'Glory Dome services' },
  { key: 'pastors', src: seniorPastors, title: 'Our Senior Pastors', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'celebration', src: nationsCelebration, title: 'Dancing with the nations', category: 'international', event: 'Nations at Dunamis' },
  { key: 'prayer', src: prayerBlackWhite, title: 'In prayer', category: 'events', event: 'Glory Dome services' },
  { key: 'paul', src: pastorPaul, title: 'Dr. Paul Enenche', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'singing', src: praiseSinging, title: 'Singing with everything she has', category: 'events', event: 'Glory Dome services' },
  { key: 'pews', src: nationsInThePews, title: 'Visitors from abroad', category: 'international', event: 'Nations at Dunamis' },
  { key: 'welfare', src: welfareFood, title: 'Food for families', category: 'events', event: 'Welfare outreach' },
  { key: 'becky', src: pastorBecky, title: 'Dr. Becky Paul-Enenche', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'ministering', src: ministeringPrayer, title: 'Being prayed for', category: 'events', event: 'Healing & Deliverance' },
  { key: 'altar', src: altarCall, title: 'At the altar', category: 'events', event: 'Glory Dome services' },
  { key: 'medical', src: medicalCare, title: 'Free medical care', category: 'events', event: 'Medical outreach' },
  { key: 'healing', src: healingMinistry, title: 'Prayer for the sick', category: 'events', event: 'Healing & Deliverance' },
  { key: 'raised', src: handsRaised, title: 'Hands raised', category: 'events', event: 'Glory Dome services' },
  { key: 'grounds', src: domeGrounds, title: 'The grounds of the Lord’s Garden', category: 'expansion', event: 'The Glory Dome' },
  { key: 'joy', src: altarJoy, title: 'Joy on the altar', category: 'events', event: 'Glory Dome services' },
  { key: 'carpet', src: flagsCarpet, title: 'Flags laid out at the altar', category: 'international', event: 'Nations at Dunamis' },
  { key: 'flags', src: flagsLifted, title: 'Flags in the air', category: 'international', event: 'Nations at Dunamis' },
  { key: 'procession', src: nationsProcession, title: 'The nations walking in', category: 'international', event: 'Nations at Dunamis' },
  { key: 'delegates', src: delegatesFlags, title: 'Guests from around the world', category: 'international', event: 'Nations at Dunamis' },
  { key: 'dome', src: domeCrowd, title: 'A full house', category: 'conventions', event: 'The Glory Dome' },
  { key: 'interior', src: gloryDomeInterior, title: 'From the balcony', category: 'expansion', event: 'The Glory Dome' },
  { key: 'worship', src: worshipCrowd, title: 'Thousands of raised hands', category: 'conventions', event: 'Glory Dome services' },
  { key: 'sax', src: saxophone, title: 'On the saxophone', category: 'conventions', event: 'Nations Worship' },
  { key: 'hands', src: handsLifted, title: 'Giving thanks', category: 'events', event: 'Glory Dome services' },
  { key: 'moment', src: prayerMoment, title: 'A quiet moment of prayer', category: 'events', event: 'Glory Dome services' },
  { key: 'rejoicing', src: rejoicing, title: 'Rejoicing together', category: 'events', event: 'Glory Dome services' },
  { key: 'laying', src: layingHands, title: 'Ministering to the people', category: 'events', event: 'Healing & Deliverance' },
  { key: 'welcome', src: welcomingGuests, title: 'Welcoming our guests', category: 'conventions', event: 'Glory Dome services' },
  { key: 'congregation', src: congregationPraise, title: 'The congregation in praise', category: 'conventions', event: 'Glory Dome services' },
  { key: 'child', src: childBlessing, title: 'A blessing for a child', category: 'events', event: 'Glory Dome services' },
  { key: 'seated', src: guestsSeated, title: 'Guests at the Glory Dome', category: 'conventions', event: 'Glory Dome services' },
  { key: 'surrender', src: surrender, title: 'In surrender', category: 'events', event: 'Glory Dome services' },
  { key: 'line', src: prayerLine, title: 'In the prayer line', category: 'events', event: 'Healing & Deliverance' },
  { key: 'among', src: inTheCongregation, title: 'Among the congregation', category: 'events', event: 'Glory Dome services' },
  { key: 'leader', src: worshipLeader, title: 'Leading worship', category: 'events', event: 'Glory Dome services' },
  { key: 'front', src: frontRow, title: 'In the front row', category: 'events', event: 'Glory Dome services' },
  { key: 'altar2', src: onTheAltar2, title: 'On the altar', category: 'events', event: 'Glory Dome services' },
  { key: 'cross', src: atTheCross, title: 'At the cross', category: 'events', event: 'Glory Dome services' },
  { key: 'walking', src: walkingTogether, title: 'Walking together', category: 'events', event: 'Glory Dome services' },
]

/** Official service posters; schedules from the church calendar (dunamisgospel.org/calendars). */
export const services = [
  { title: 'Healing & Deliverance Service', when: 'Every Tuesday, 9:30am', poster: healingPoster },
  { title: 'Power Communion Service', when: 'Every Wednesday, 5:30pm', poster: communionPoster },
  { title: 'Blessing Sunday Service', when: 'First Sunday of the month', poster: blessingPoster },
  { title: 'Anointing Service', when: 'Second Sunday of the month', poster: anointingPoster },
  { title: 'Impartation Service', when: 'Third Sunday of the month', poster: impartationPoster },
  { title: 'Testimonies & Thanksgiving Service', when: 'Fourth Sunday of the month', poster: thanksgivingPoster },
]
