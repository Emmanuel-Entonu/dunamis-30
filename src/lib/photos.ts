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
import worshipLeader from '@/assets/gallery/worship-leader.webp'
import worshipTears from '@/assets/gallery/worship-tears.webp'
import angolaWelcome from '@/assets/crusades/angola-welcome.webp'
import argentinaArena from '@/assets/crusades/argentina-arena.webp'
import argentinaChildren from '@/assets/crusades/argentina-children.webp'
import argentinaFlag from '@/assets/crusades/argentina-flag.webp'
import argentinaHands from '@/assets/crusades/argentina-hands.webp'
import argentinaJoy from '@/assets/crusades/argentina-joy.webp'
import argentinaPreaching from '@/assets/crusades/argentina-preaching.webp'
import argentinaReaching from '@/assets/crusades/argentina-reaching.webp'
import argentinaWalking from '@/assets/crusades/argentina-walking.webp'
import cambodiaWelcome from '@/assets/crusades/cambodia-welcome.webp'
import canadaCrowd from '@/assets/crusades/canada-crowd.webp'
import canadaStage from '@/assets/crusades/canada-stage.webp'
import canadaWelcome from '@/assets/crusades/canada-welcome.webp'
import canadaWorship from '@/assets/crusades/canada-worship.webp'
import lagosOverflow from '@/assets/crusades/lagos-overflow.webp'
import romaniaArmsRaised from '@/assets/crusades/romania-arms-raised.webp'
import cameroonFlag from '@/assets/crusades/cameroon-flag.webp'
import nicaraguaCrowd from '@/assets/crusades/nicaragua-crowd.webp'
import indonesiaWelcome from '@/assets/crusades/indonesia-welcome.webp'
import latviaHall from '@/assets/crusades/latvia-hall.webp'
import latviaStage from '@/assets/crusades/latvia-stage.webp'
import latviaWorship from '@/assets/crusades/latvia-worship.webp'
import lesothoBlankets from '@/assets/crusades/lesotho-blankets.webp'
import lesothoCrowd from '@/assets/crusades/lesotho-crowd.webp'
import lesothoFlag from '@/assets/crusades/lesotho-flag.webp'
import lesothoHands from '@/assets/crusades/lesotho-hands.webp'
import lesothoPrayer from '@/assets/crusades/lesotho-prayer.webp'
import lesothoPreaching from '@/assets/crusades/lesotho-preaching.webp'
import lesothoRaised from '@/assets/crusades/lesotho-raised.webp'
import lesothoStadium from '@/assets/crusades/lesotho-stadium.webp'
import lesothoStage from '@/assets/crusades/lesotho-stage.webp'
import lesothoWorship from '@/assets/crusades/lesotho-worship.webp'
import madallaCrowdNight from '@/assets/crusades/madalla-crowd-night.webp'
import madallaCrowd from '@/assets/crusades/madalla-crowd.webp'
import madallaPreaching from '@/assets/crusades/madalla-preaching.webp'
import madallaRaisedHand from '@/assets/crusades/madalla-raised-hand.webp'
import madallaStage from '@/assets/crusades/madalla-stage.webp'
import romaniaCrowd from '@/assets/crusades/romania-crowd.webp'
import romaniaGoldenHour from '@/assets/crusades/romania-golden-hour.webp'
import romaniaPreaching from '@/assets/crusades/romania-preaching.webp'
import romaniaSky from '@/assets/crusades/romania-sky.webp'
import romaniaSquare from '@/assets/crusades/romania-square.webp'
import romaniaSunset from '@/assets/crusades/romania-sunset.webp'
import thailandNight from '@/assets/crusades/thailand-night.webp'
import thailandStage from '@/assets/crusades/thailand-stage.webp'
import thailandStudents from '@/assets/crusades/thailand-students.webp'
import venezuelaDome from '@/assets/crusades/venezuela-dome.webp'
import venezuelaStage from '@/assets/crusades/venezuela-stage.webp'
import zambiaArrival from '@/assets/crusades/zambia-arrival.webp'
import zambiaDrums from '@/assets/crusades/zambia-drums.webp'
import stripArgentinaBaby from '@/assets/crusades/strip/argentina-baby.webp'
import stripArgentinaFlags from '@/assets/crusades/strip/argentina-flags.webp'
import stripCanadaFamily from '@/assets/crusades/strip/canada-family.webp'
import stripLatviaPrayer from '@/assets/crusades/strip/latvia-prayer.webp'
import stripLesothoPrayerLine from '@/assets/crusades/strip/lesotho-prayer-line.webp'
import stripRomaniaLookingUp from '@/assets/crusades/strip/romania-looking-up.webp'
import stripRomaniaPraise from '@/assets/crusades/strip/romania-praise.webp'
import stripRomaniaSinging from '@/assets/crusades/strip/romania-singing.webp'
import stripThailandHands from '@/assets/crusades/strip/thailand-hands.webp'
import stripVenezuelaCrutches from '@/assets/crusades/strip/venezuela-crutches.webp'
import stripZambiaWelcome from '@/assets/crusades/strip/zambia-welcome.webp'
import gloryDomeInterior from '@/assets/photos/glory-dome-interior.webp'
import pastorBeckyRed from '@/assets/photos/pastor-becky-red.webp'
import pastorBeckyHome from '@/assets/photos/pastor-becky-home.webp'
import pastorBeckyPortrait from '@/assets/photos/pastor-becky-portrait.webp'
import pastorPaulHome from '@/assets/photos/pastor-paul-home.webp'
import pastorPaulPortrait from '@/assets/photos/pastor-paul-portrait.webp'
import pastorsBeforeTheCrowd from '@/assets/photos/pastors-before-the-crowd.webp'
import pastorPaulRed from '@/assets/photos/pastor-paul-red.webp'
import seniorPastors from '@/assets/photos/senior-pastors.webp'
import anointingPoster from '@/assets/posters/anointing-service.webp'
import blessingPoster from '@/assets/posters/blessing-sunday.webp'
import healingPoster from '@/assets/posters/healing-deliverance.webp'
import impartationPoster from '@/assets/posters/impartation-service.webp'
import communionPoster from '@/assets/posters/power-communion.webp'
import thanksgivingPoster from '@/assets/posters/thanksgiving-service.webp'
import pastorBeckyMicrophone from '@/assets/photos/pastor-becky-microphone.webp'
import place_bicolandiaPhilippines from '@/assets/crusades/places/bicolandia-philippines.webp'
import place_manilaPhilippines from '@/assets/crusades/places/manila-philippines.webp'
import place_bayelsaNigeria from '@/assets/crusades/places/bayelsa-nigeria.webp'
import place_onitshaNigeria from '@/assets/crusades/places/onitsha-nigeria.webp'
import place_beninNigeria from '@/assets/crusades/places/benin-nigeria.webp'
import place_universityOfBeninNigeria from '@/assets/crusades/places/university-of-benin-nigeria.webp'
import place_damangazaNigeria from '@/assets/crusades/places/damangaza-nigeria.webp'
import place_abaNigeria from '@/assets/crusades/places/aba-nigeria.webp'
import place_umuahiaNigeria from '@/assets/crusades/places/umuahia-nigeria.webp'
import place_michaelOkparaUniversityNigeria from '@/assets/crusades/places/michael-okpara-university-nigeria.webp'
import place_newcastleUnitedKingdom from '@/assets/crusades/places/newcastle-united-kingdom.webp'
import place_mararabaNigeria from '@/assets/crusades/places/mararaba-nigeria.webp'
import place_gbuduwyiAndPasaliNigeria from '@/assets/crusades/places/gbuduwyi-and-pasali-nigeria.webp'
import place_ebiralandOkeneNigeria from '@/assets/crusades/places/ebiraland-okene-nigeria.webp'
import place_jalingoNigeria from '@/assets/crusades/places/jalingo-nigeria.webp'
import place_tarabaStateUniversityNigeria from '@/assets/crusades/places/taraba-state-university-nigeria.webp'
import place_uyoNigeria from '@/assets/crusades/places/uyo-nigeria.webp'
import place_managuaNicaragua from '@/assets/crusades/places/managua-nicaragua.webp'
import place_bwariNigeria from '@/assets/crusades/places/bwari-nigeria.webp'
import place_doualaCameroon from '@/assets/crusades/places/douala-cameroon.webp'
import place_jahiFctNigeria from '@/assets/crusades/places/jahi-fct-nigeria.webp'
import place_gosaFctNigeria from '@/assets/crusades/places/gosa-fct-nigeria.webp'
import place_laGuairaVenezuela from '@/assets/crusades/places/la-guaira-venezuela.webp'
import place_bassaFctNigeria from '@/assets/crusades/places/bassa-fct-nigeria.webp'
import place_iddoSarkiFctNigeria from '@/assets/crusades/places/iddo-sarki-fct-nigeria.webp'
import place_resistenciaArgentina from '@/assets/crusades/places/resistencia-argentina.webp'
import place_saoPauloBrazil from '@/assets/crusades/places/sao-paulo-brazil.webp'
import place_ontarioCanada from '@/assets/crusades/places/ontario-canada.webp'
import place_oradeaRomania from '@/assets/crusades/places/oradea-romania.webp'
import place_parisFrance from '@/assets/crusades/places/paris-france.webp'
import place_berlinGermany from '@/assets/crusades/places/berlin-germany.webp'
import place_rigaLatvia from '@/assets/crusades/places/riga-latvia.webp'
import place_lugbeBergerFctNigeria from '@/assets/crusades/places/lugbe-berger-fct-nigeria.webp'
import place_pragueCzechRepublic from '@/assets/crusades/places/prague-czech-republic.webp'
import place_marylandUnitedStates from '@/assets/crusades/places/maryland-united-states.webp'
import place_lugbeBergerFctNigeria2 from '@/assets/crusades/places/lugbe-berger-fct-nigeria-2.webp'
import place_karshiFctNigeria from '@/assets/crusades/places/karshi-fct-nigeria.webp'
import place_luandaAngola from '@/assets/crusades/places/luanda-angola.webp'
import place_kampalaUganda from '@/assets/crusades/places/kampala-uganda.webp'
import place_wuseFctNigeria from '@/assets/crusades/places/wuse-fct-nigeria.webp'
import place_madallaNigeria from '@/assets/crusades/places/madalla-nigeria.webp'
import place_miamiFloridaUnitedStates from '@/assets/crusades/places/miami-florida-united-states.webp'
import place_lagosNigeria from '@/assets/crusades/places/lagos-nigeria.webp'
import place_enuguNigeria from '@/assets/crusades/places/enugu-nigeria.webp'
import place_rayongThailand from '@/assets/crusades/places/rayong-thailand.webp'
import place_siemReapCambodia from '@/assets/crusades/places/siem-reap-cambodia.webp'
import place_ambonIndonesia from '@/assets/crusades/places/ambon-indonesia.webp'
import place_maseruLesotho from '@/assets/crusades/places/maseru-lesotho.webp'
import place_lusakaZambia from '@/assets/crusades/places/lusaka-zambia.webp'

/**
 * Official photographs (dunamisgospel.org). The CMS gallery replaces these once it has items.
 * The pastors' photos are from the church's YouTube channels, posted in early November 2026, and
 * from the church directly on 6 November 2026, along with the Glory Dome from the outside.
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
  pastorBeckyHome,
  pastorPaulHome,
  pastorPaulPortrait,
  pastorsBeforeTheCrowd,
  praiseSinging,
  prayerBlackWhite,
  seniorPastors,
  welfareFood,
  worshipTears,
}

export type PhotoKey = keyof typeof photos

/** `label` is for the few the church didn't call a crusade. */
export type CrusadePhoto = { src: StaticImageData; place: string; title: string; alt: string; label?: string }

/**
 * Crusades in 2026, from the image posts on the church's official YouTube channels. Only posts the church
 * itself labelled belong here, under the name it gave them. They're cropped clear of the logos laid over them.
 */
export const crusadePhotos = {
  argentinaArena: { src: argentinaArena, place: 'Argentina', title: 'A full arena in Argentina', alt: 'Thousands filling the arena at the Argentina Revival Crusade, with the stage lit up in the distance' },
  romaniaGoldenHour: { src: romaniaGoldenHour, place: 'Romania', title: 'Golden hour in the square', alt: 'The crusade stage in a Romanian city square at golden hour, beside a grand old building' },
  argentinaFlag: { src: argentinaFlag, place: 'Argentina', title: 'The flag of Argentina on the altar', alt: 'Dr. Becky Paul-Enenche on the stage beside the flag of Argentina, with the crowd reaching forward' },
  canadaStage: { src: canadaStage, place: 'Canada', title: 'The arena in Canada', alt: 'The stage and the crowd in the arena at the Canada Revival Crusade' },
  lesothoBlankets: { src: lesothoBlankets, place: 'Lesotho', title: 'In Basotho hats and blankets', alt: 'Dr. Paul and Dr. Becky Paul-Enenche smiling in traditional Basotho hats and blankets in Lesotho' },
  romaniaSquare: { src: romaniaSquare, place: 'Romania', title: 'The city square in Romania', alt: 'Crowds seated in a city square at the Romania Revival Fire Crusade, with old buildings behind them' },
  latviaHall: { src: latviaHall, place: 'Latvia', title: 'Rivers of Revival in Riga', alt: 'The hall at the Latvia Revival Fire Crusade, with the stage lit up in blue' },
  thailandNight: { src: thailandNight, place: 'Thailand', title: 'A night of revival', alt: 'A huge crowd at night in Thailand, with the stage lights flaring across the sky', label: 'Revival night' },
  venezuelaDome: { src: venezuelaDome, place: 'Venezuela', title: 'Inside the dome in La Guaira', alt: 'The stage and the packed Jose Maria Vargas Dome at the Venezuela Revival Fire Crusade' },
  zambiaArrival: { src: zambiaArrival, place: 'Zambia', title: 'Arriving in Zambia', alt: 'Dr. Paul and Dr. Becky Paul-Enenche in Zambian scarves, being welcomed by a crowd' },
  angolaWelcome: { src: angolaWelcome, place: 'Angola', title: 'A warm welcome in Angola', alt: 'Dr. Paul and Dr. Becky Paul-Enenche being welcomed on arrival in Angola' },
  romaniaSunset: { src: romaniaSunset, place: 'Romania', title: 'Hands raised at sunset', alt: 'A man with both hands raised at sunset at the Romania Revival Fire Crusade' },
  argentinaHands: { src: argentinaHands, place: 'Argentina', title: 'Hands reaching forward', alt: 'A crowd reaching forward under purple lights at the Argentina Revival Crusade' },
  canadaWorship: { src: canadaWorship, place: 'Canada', title: 'In worship', alt: 'The front rows in worship at the Canada Revival Crusade' },
  thailandStudents: { src: thailandStudents, place: 'Thailand', title: 'Students in worship', alt: 'Students in school uniform worshipping at the Night of Revival and Miracles in Thailand', label: 'Revival night' },
  lesothoRaised: { src: lesothoRaised, place: 'Lesotho', title: 'Arms raised', alt: 'A woman with her arms raised in the crowd at night at the Lesotho crusade' },
  romaniaSky: { src: romaniaSky, place: 'Romania', title: 'Under an open sky', alt: 'A young man with his hands raised against a blue sky at the Romania Revival Fire Crusade' },
  canadaCrowd: { src: canadaCrowd, place: 'Canada', title: 'Standing in prayer', alt: 'People standing in prayer in the arena at the Canada Revival Crusade' },
  latviaWorship: { src: latviaWorship, place: 'Latvia', title: 'Worship in Latvia', alt: 'An older woman worshipping in the crowd at the Latvia Revival Fire Crusade, in black and white' },
  argentinaReaching: { src: argentinaReaching, place: 'Argentina', title: 'Reaching out to the people', alt: 'Dr. Paul and Dr. Becky Paul-Enenche reaching down to the crowd at the Argentina Revival Crusade' },
  venezuelaStage: { src: venezuelaStage, place: 'Venezuela', title: 'On the stage in Venezuela', alt: 'People on the stage at the Venezuela Revival Fire Crusade, with crutches and walking aids in front of them' },
  thailandStage: { src: thailandStage, place: 'Thailand', title: 'The stage in Thailand', alt: 'The outdoor stage and the crowd at the Night of Revival and Miracles in Thailand', label: 'Revival night' },
  romaniaPreaching: { src: romaniaPreaching, place: 'Romania', title: 'Preaching over the city', alt: 'Preaching from the stage at the Romania Revival Fire Crusade, looking out over the city' },
  argentinaPreaching: { src: argentinaPreaching, place: 'Argentina', title: 'Preaching in Argentina', alt: 'Dr. Paul Enenche in red, preaching with the crowd behind him at the Argentina Revival Crusade' },
  romaniaCrowd: { src: romaniaCrowd, place: 'Romania', title: 'Standing in the square', alt: 'A crowd standing in the city square at the Romania Revival Fire Crusade' },
  argentinaJoy: { src: argentinaJoy, place: 'Argentina', title: 'Arms wide open', alt: 'A man with his arms wide open in the crowd at the Argentina Revival Crusade' },
  lesothoStadium: { src: lesothoStadium, place: 'Lesotho', title: 'Setsoto Stadium', alt: 'The crowd at Setsoto Stadium at night during the Lesotho crusade' },
  latviaStage: { src: latviaStage, place: 'Latvia', title: 'On the stage in Latvia', alt: 'Dr. Becky Paul-Enenche speaking on the stage at the Latvia Revival Fire Crusade, with a man beside her holding a microphone' },
  argentinaChildren: { src: argentinaChildren, place: 'Argentina', title: 'With the young people', alt: 'Dr. Becky Paul-Enenche smiling among young people dressed in white at the Argentina Revival Crusade' },
  zambiaDrums: { src: zambiaDrums, place: 'Zambia', title: 'Drummers in Zambia', alt: 'Drummers and dancers giving a welcome on arrival in Zambia' },
  canadaWelcome: { src: canadaWelcome, place: 'Canada', title: 'A warm welcome in Canada', alt: 'Dr. Paul Enenche in a Canada jersey, carrying a child' },
  cambodiaWelcome: { src: cambodiaWelcome, place: 'Cambodia', title: 'Welcome to Cambodia', alt: 'Dr. Paul and Dr. Becky Paul-Enenche being welcomed behind a banner in Cambodia', label: 'Mission' },
  lesothoStage: { src: lesothoStage, place: 'Lesotho', title: 'The stage at night', alt: 'The stage at night at the Lesotho crusade' },
  argentinaWalking: { src: argentinaWalking, place: 'Argentina', title: 'A woman lifts her hands', alt: 'A woman lifting her hands in the aisle at the Argentina Revival Crusade, with a walking frame beside her' },
  madallaCrowdNight: { src: madallaCrowdNight, place: 'Madalla', title: 'Thousands under the trees', alt: 'Thousands gathered at night under the trees at the Madalla crusade, with the stage lit in the distance' },
  lesothoFlag: { src: lesothoFlag, place: 'Lesotho', title: 'The flag of Lesotho over the crowd', alt: 'The flag of Lesotho waving over the crowd at the Lesotho crusade' },
  lesothoPreaching: { src: lesothoPreaching, place: 'Lesotho', title: 'Preaching at the crusade', alt: 'Dr. Paul Enenche preaching at the Lesotho crusade' },
  madallaPreaching: { src: madallaPreaching, place: 'Madalla', title: 'From behind the pulpit', alt: 'Preaching to the crowd at the Madalla crusade, seen from behind the pulpit, in black and white' },
  madallaStage: { src: madallaStage, place: 'Madalla', title: 'The stage and the field', alt: 'Ministering from the stage at the Madalla crusade, with the crowd across the field' },
  lagosOverflow: { src: lagosOverflow, place: 'Lagos', title: 'The overflow from above', alt: 'The Lagos Apostolic Crusade from above, with the overflow crowds marked' },
  romaniaArmsRaised: { src: romaniaArmsRaised, place: 'Romania', title: 'Both arms raised', alt: 'A man raising both arms in worship in the city square at the Romania Revival Fire Crusade' },
  cameroonFlag: { src: cameroonFlag, place: 'Cameroon', title: 'The flag of Cameroon', alt: 'A crowd waving the flag of Cameroon to welcome the team to Douala for the crusade' },
  nicaraguaCrowd: { src: nicaraguaCrowd, place: 'Nicaragua', title: 'The crowd in Nicaragua', alt: 'The crowd at the Nicaragua Revival Fire Crusade at night, under trees of coloured lights' },
  indonesiaWelcome: { src: indonesiaWelcome, place: 'Indonesia', title: 'A warm welcome in Indonesia', alt: 'Dr. Paul Enenche in a woven scarf and Dr. Becky Paul-Enenche being welcomed to Indonesia at night' },
  lesothoWorship: { src: lesothoWorship, place: 'Lesotho', title: 'A hand raised in worship', alt: 'Dr. Becky Paul-Enenche with her hand raised at the Lesotho crusade' },
  lesothoHands: { src: lesothoHands, place: 'Lesotho', title: 'Hands raised for prayer', alt: 'People with their hands raised as they are prayed for at the Lesotho crusade' },
  madallaRaisedHand: { src: madallaRaisedHand, place: 'Madalla', title: 'Facing the crowd', alt: 'A hand raised over the crowd at the Madalla crusade, in black and white' },
  madallaCrowd: { src: madallaCrowd, place: 'Madalla', title: 'The crowd at night', alt: 'The crowd at the Madalla crusade at night' },
  lesothoCrowd: { src: lesothoCrowd, place: 'Lesotho', title: 'Under the floodlights', alt: 'People seated under the floodlights at the Lesotho crusade' },
  lesothoPrayer: { src: lesothoPrayer, place: 'Lesotho', title: 'In prayer', alt: 'People in prayer at the Lesotho crusade' },
} satisfies Record<string, CrusadePhoto>

/**
 * The church's own crusade photographs, one per place, captioned by the church (sent on 7 November 2026).
 * Cropped clear of the caption bar and any printed logo. All of them are in the gallery.
 */
export const crusadePlaces: { key: string; src: StaticImageData; place: string; country: string }[] = [
  { key: 'bicolandiaPhilippines', src: place_bicolandiaPhilippines, place: 'Bicolandia', country: 'Philippines' },
  { key: 'manilaPhilippines', src: place_manilaPhilippines, place: 'Manila', country: 'Philippines' },
  { key: 'bayelsaNigeria', src: place_bayelsaNigeria, place: 'Bayelsa', country: 'Nigeria' },
  { key: 'onitshaNigeria', src: place_onitshaNigeria, place: 'Onitsha', country: 'Nigeria' },
  { key: 'beninNigeria', src: place_beninNigeria, place: 'Benin', country: 'Nigeria' },
  { key: 'universityOfBeninNigeria', src: place_universityOfBeninNigeria, place: 'University of Benin', country: 'Nigeria' },
  { key: 'damangazaNigeria', src: place_damangazaNigeria, place: 'Damangaza', country: 'Nigeria' },
  { key: 'abaNigeria', src: place_abaNigeria, place: 'Aba', country: 'Nigeria' },
  { key: 'umuahiaNigeria', src: place_umuahiaNigeria, place: 'Umuahia', country: 'Nigeria' },
  { key: 'michaelOkparaUniversityNigeria', src: place_michaelOkparaUniversityNigeria, place: 'Michael Okpara University', country: 'Nigeria' },
  { key: 'newcastleUnitedKingdom', src: place_newcastleUnitedKingdom, place: 'Newcastle', country: 'United Kingdom' },
  { key: 'mararabaNigeria', src: place_mararabaNigeria, place: 'Mararaba', country: 'Nigeria' },
  { key: 'gbuduwyiAndPasaliNigeria', src: place_gbuduwyiAndPasaliNigeria, place: 'Gbuduwyi and Pasali', country: 'Nigeria' },
  { key: 'ebiralandOkeneNigeria', src: place_ebiralandOkeneNigeria, place: 'Ebiraland (Okene)', country: 'Nigeria' },
  { key: 'jalingoNigeria', src: place_jalingoNigeria, place: 'Jalingo', country: 'Nigeria' },
  { key: 'tarabaStateUniversityNigeria', src: place_tarabaStateUniversityNigeria, place: 'Taraba State University', country: 'Nigeria' },
  { key: 'uyoNigeria', src: place_uyoNigeria, place: 'Uyo', country: 'Nigeria' },
  { key: 'managuaNicaragua', src: place_managuaNicaragua, place: 'Managua', country: 'Nicaragua' },
  { key: 'bwariNigeria', src: place_bwariNigeria, place: 'Bwari', country: 'Nigeria' },
  { key: 'doualaCameroon', src: place_doualaCameroon, place: 'Douala', country: 'Cameroon' },
  { key: 'jahiFctNigeria', src: place_jahiFctNigeria, place: 'Jahi, FCT', country: 'Nigeria' },
  { key: 'gosaFctNigeria', src: place_gosaFctNigeria, place: 'Gosa, FCT', country: 'Nigeria' },
  { key: 'laGuairaVenezuela', src: place_laGuairaVenezuela, place: 'La Guaira', country: 'Venezuela' },
  { key: 'bassaFctNigeria', src: place_bassaFctNigeria, place: 'Bassa, FCT', country: 'Nigeria' },
  { key: 'iddoSarkiFctNigeria', src: place_iddoSarkiFctNigeria, place: 'Iddo Sarki, FCT', country: 'Nigeria' },
  { key: 'resistenciaArgentina', src: place_resistenciaArgentina, place: 'Resistencia', country: 'Argentina' },
  { key: 'saoPauloBrazil', src: place_saoPauloBrazil, place: 'São Paulo', country: 'Brazil' },
  { key: 'ontarioCanada', src: place_ontarioCanada, place: 'Ontario', country: 'Canada' },
  { key: 'oradeaRomania', src: place_oradeaRomania, place: 'Oradea', country: 'Romania' },
  { key: 'parisFrance', src: place_parisFrance, place: 'Paris', country: 'France' },
  { key: 'berlinGermany', src: place_berlinGermany, place: 'Berlin', country: 'Germany' },
  { key: 'rigaLatvia', src: place_rigaLatvia, place: 'Riga', country: 'Latvia' },
  { key: 'lugbeBergerFctNigeria', src: place_lugbeBergerFctNigeria, place: 'Lugbe-Berger, FCT', country: 'Nigeria' },
  { key: 'pragueCzechRepublic', src: place_pragueCzechRepublic, place: 'Prague', country: 'Czech Republic' },
  { key: 'marylandUnitedStates', src: place_marylandUnitedStates, place: 'Maryland', country: 'United States' },
  { key: 'lugbeBergerFctNigeria2', src: place_lugbeBergerFctNigeria2, place: 'Lugbe-Berger, FCT', country: 'Nigeria' },
  { key: 'karshiFctNigeria', src: place_karshiFctNigeria, place: 'Karshi, FCT', country: 'Nigeria' },
  { key: 'luandaAngola', src: place_luandaAngola, place: 'Luanda', country: 'Angola' },
  { key: 'kampalaUganda', src: place_kampalaUganda, place: 'Kampala', country: 'Uganda' },
  { key: 'wuseFctNigeria', src: place_wuseFctNigeria, place: 'Wuse, FCT', country: 'Nigeria' },
  { key: 'madallaNigeria', src: place_madallaNigeria, place: 'Madalla', country: 'Nigeria' },
  { key: 'miamiFloridaUnitedStates', src: place_miamiFloridaUnitedStates, place: 'Miami, Florida', country: 'United States' },
  { key: 'lagosNigeria', src: place_lagosNigeria, place: 'Lagos', country: 'Nigeria' },
  { key: 'enuguNigeria', src: place_enuguNigeria, place: 'Enugu', country: 'Nigeria' },
  { key: 'rayongThailand', src: place_rayongThailand, place: 'Rayong', country: 'Thailand' },
  { key: 'siemReapCambodia', src: place_siemReapCambodia, place: 'Siem Reap', country: 'Cambodia' },
  { key: 'ambonIndonesia', src: place_ambonIndonesia, place: 'Ambon', country: 'Indonesia' },
  { key: 'maseruLesotho', src: place_maseruLesotho, place: 'Maseru', country: 'Lesotho' },
  { key: 'lusakaZambia', src: place_lusakaZambia, place: 'Lusaka', country: 'Zambia' },
]

const placePhoto = (key: string): CrusadePhoto => {
  const p = crusadePlaces.find((c) => c.key === key)
  if (!p) throw new Error(`No crusade photo called ${key}`)
  return { src: p.src, place: p.country, title: `${p.place}, ${p.country}`, alt: `The crowd at the crusade in ${p.place}, ${p.country}` }
}

/**
 * The crusades abroad on the home page, with the church's photograph of each place. Event names and dates
 * appear only where the church's own posts give them for that same place.
 */
export const crusadeNations: { name: string; event?: string; when?: string; photo: CrusadePhoto }[] = [
  { name: 'Romania', event: 'Revival Fire Crusade', when: 'Oradea, 3 to 4 July 2026', photo: placePhoto('oradeaRomania') },
  { name: 'Philippines', event: 'Healing and Deliverance Crusade', when: 'Manila', photo: placePhoto('manilaPhilippines') },
  { name: 'Venezuela', event: 'Revival Fire Crusade', when: 'La Guaira, 4 to 5 June 2026', photo: placePhoto('laGuairaVenezuela') },
  { name: 'United Kingdom', when: 'Newcastle', photo: placePhoto('newcastleUnitedKingdom') },
  { name: 'Lesotho', event: 'Healing and Deliverance Crusade', when: 'Maseru, 2 to 3 November 2026', photo: placePhoto('maseruLesotho') },
  { name: 'France', event: 'Revival Fire Crusade', when: 'Paris', photo: placePhoto('parisFrance') },
  { name: 'Argentina', event: 'Revival Crusade', when: 'Resistencia', photo: placePhoto('resistenciaArgentina') },
  { name: 'Cameroon', event: 'Healing and Deliverance Crusade', when: 'Douala', photo: placePhoto('doualaCameroon') },
  { name: 'Germany', event: 'Revival Fire Crusade', when: 'Berlin', photo: placePhoto('berlinGermany') },
  { name: 'Thailand', event: 'Night of Revival and Miracles', when: 'Rayong, October 2026', photo: placePhoto('rayongThailand') },
  { name: 'United States', when: 'Miami, Florida', photo: placePhoto('miamiFloridaUnitedStates') },
  { name: 'Uganda', when: 'Kampala', photo: placePhoto('kampalaUganda') },
  { name: 'Latvia', event: 'Revival Fire Crusade', when: 'Riga, 16 to 17 July 2026', photo: placePhoto('rigaLatvia') },
  { name: 'Brazil', when: 'São Paulo', photo: placePhoto('saoPauloBrazil') },
  { name: 'Zambia', event: 'Healing and Deliverance Crusade', when: 'Lusaka, 4 to 5 November 2026', photo: placePhoto('lusakaZambia') },
  { name: 'Czech Republic', when: 'Prague', photo: placePhoto('pragueCzechRepublic') },
  { name: 'Canada', event: 'Revival Crusade', when: 'Ontario', photo: placePhoto('ontarioCanada') },
  { name: 'Nicaragua', event: 'Revival Fire Crusade', when: 'Managua', photo: placePhoto('managuaNicaragua') },
  { name: 'Cambodia', event: 'The Love and Mercy of God', when: 'Siem Reap, 21 October 2026', photo: placePhoto('siemReapCambodia') },
  { name: 'Philippines', when: 'Bicolandia', photo: placePhoto('bicolandiaPhilippines') },
  { name: 'Angola', event: 'Healing and Deliverance Crusade', when: 'Luanda', photo: placePhoto('luandaAngola') },
  { name: 'United States', when: 'Maryland', photo: placePhoto('marylandUnitedStates') },
  { name: 'Indonesia', when: 'Ambon, October 2026', photo: placePhoto('ambonIndonesia') },
]

/** The strip above the footer. None of these appear anywhere else, so it can sit on every page. */
export const crusadeStrip = [
  { src: stripArgentinaBaby, place: 'Argentina', alt: 'Dr. Paul Enenche smiling beside a baby at the Argentina Revival Crusade' },
  { src: stripRomaniaLookingUp, place: 'Romania', alt: 'A woman looking up to the sky at the Romania Revival Fire Crusade' },
  { src: stripZambiaWelcome, place: 'Zambia', alt: 'Dr. Becky Paul-Enenche greeting people on arrival in Zambia' },
  { src: stripRomaniaSinging, place: 'Romania', alt: 'Dr. Becky Paul-Enenche singing at the Romania Revival Fire Crusade' },
  { src: stripLesothoPrayerLine, place: 'Lesotho', alt: 'Women in prayer at the Lesotho crusade' },
  { src: stripArgentinaFlags, place: 'Argentina', alt: 'People with flags greeting the team in Argentina' },
  { src: stripLatviaPrayer, place: 'Latvia', alt: 'Dr. Becky Paul-Enenche praying for a woman at the Latvia Revival Fire Crusade' },
  { src: stripCanadaFamily, place: 'Canada', alt: 'Dr. Paul Enenche in a Canada jersey with a family at the Canada Revival Crusade' },
  { src: stripThailandHands, place: 'Thailand', alt: 'Hands raised at night in Thailand' },
  { src: stripVenezuelaCrutches, place: 'Venezuela', alt: 'People with walking aids on the stage at the Venezuela Revival Fire Crusade' },
  { src: stripRomaniaPraise, place: 'Romania', alt: 'People praising God with their hands raised at the Romania Revival Fire Crusade' },
]

/** Milestones refer to their photographs by asset file name. */
export const photoByFile: Record<string, StaticImageData> = {
  'hands-raised': handsRaised,
  'congregation-praise': congregationPraise,
  'worship-tears': worshipTears,
  'dome-grounds': domeGrounds,
  'nations-celebration': nationsCelebration,
  'nations-cameroon': nationsCameroon,
  'nations-crowd': nationsCrowd,
  'medical-care': medicalCare,
  'dome-interior-wide': domeInteriorWide,
  'lesotho-prayer': lesothoPrayer,
}

/** `titled`: the photo carries its own printed title, so the gallery doesn't lay a caption over it. */
export type GalleryEntry = { key: string; src: StaticImageData; title: string; category: string; event: string; year?: number; titled?: boolean }

/**
 * Launch gallery, sharpest photographs first. Scene captions only: the communications team can add
 * names, years and events from the CMS, where each item replaces this list.
 */
export const defaultGallery: GalleryEntry[] = [
  { key: 'exterior', src: domeExterior, title: 'The Glory Dome', category: 'expansion', event: 'The Glory Dome' },
  { key: 'wide', src: domeInteriorWide, title: 'Inside the Glory Dome', category: 'conventions', event: 'The Glory Dome' },
  { key: 'crowd', src: nationsCrowd, title: 'Carrying the flag in worship', category: 'international', event: 'Nations at Dunamis' },
  { key: 'cameroon', src: nationsCameroon, title: 'The flag of Cameroon at the altar', category: 'international', event: 'Nations at Dunamis' },
  { key: 'tears', src: worshipTears, title: 'Tears in the presence of God', category: 'events', event: 'Glory Dome services' },
  { key: 'pastors', src: seniorPastors, title: 'Our Senior Pastors', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'before-the-crowd', src: pastorsBeforeTheCrowd, title: 'Hand in hand before the crowd', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'paul-portrait', src: pastorPaulPortrait, title: 'Dr. Paul Enenche', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'becky-portrait', src: pastorBeckyPortrait, title: 'Dr. Becky Paul-Enenche', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'paul-red', src: pastorPaulRed, title: 'Dr. Paul Enenche ministering', category: 'pastor', event: 'Our Senior Pastors' },
  { key: 'becky-red', src: pastorBeckyRed, title: 'Dr. Becky Paul-Enenche ministering', category: 'pastor', event: 'Our Senior Pastors' },
  ...crusadePlaces.map((p) => ({ key: `place-${p.key}`, src: p.src, title: `${p.place}, ${p.country}`, category: 'crusades', event: `${p.country} crusade`, titled: true })),
  { key: 'becky-microphone', src: pastorBeckyMicrophone, title: 'Dr. Becky Paul-Enenche at the Argentina Revival Crusade', category: 'pastor', event: 'Our Senior Pastors' },
  ...Object.entries(crusadePhotos).map(([key, photo]) => ({ key: `crusade-${key}`, src: photo.src, title: photo.title, category: 'crusades', event: `${photo.place} ${('label' in photo ? photo.label : 'crusade').toLowerCase()}` })),
  { key: 'celebration', src: nationsCelebration, title: 'Dancing with the nations', category: 'international', event: 'Nations at Dunamis' },
  { key: 'prayer', src: prayerBlackWhite, title: 'In prayer', category: 'events', event: 'Glory Dome services' },
  { key: 'singing', src: praiseSinging, title: 'Singing with everything she has', category: 'events', event: 'Glory Dome services' },
  { key: 'pews', src: nationsInThePews, title: 'Visitors from abroad', category: 'international', event: 'Nations at Dunamis' },
  { key: 'welfare', src: welfareFood, title: 'Food for families', category: 'events', event: 'Welfare outreach' },
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
