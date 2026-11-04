import type { Metadata } from 'next'
import Image from 'next/image'
import Link from '@/components/SiteLink'

import { glass } from '@/assets/glass'
import { GlassArt, GlassTile, Label } from '@/components/blocks'
import { Faq } from '@/components/Faq'
import { Carousel } from '@/components/home/Carousel'
import { MapPin, socialIcons, WhatsApp } from '@/components/icons'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { ShareButtons } from '@/components/ShareButtons'
import { getSite } from '@/lib/content'
import { defaultContacts, defaultFaqs, directionsUrl, officialAccounts, venueAddress, whatsappLink, type ContactDesk } from '@/lib/ministry'
import { services } from '@/lib/photos'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'How to reach the church about the anniversary, international travel, testimonies and our regular services, plus answers to common questions.',
}

const deskArt = [glass.chat, glass.plane, glass.quote]
const accountArt = [glass.church, glass.mic, glass.dove]

function DeskActions({ desk }: { desk: ContactDesk }) {
  return (
    <>
      {desk.whatsapp && (
        <a href={whatsappLink(desk.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-chip">
          <WhatsApp width={18} height={18} /> {desk.whatsapp}
        </a>
      )}
      {desk.phone && (
        <a href={`tel:${desk.phone.replace(/\s/g, '')}`} className="btn-chip">
          Call {desk.phone}
        </a>
      )}
      {desk.email && (
        <a href={`mailto:${desk.email}`} className="btn-chip break-all">
          {desk.email}
        </a>
      )}
      {desk.link && (
        <Link href={desk.link.href} className="btn-chip">
          {desk.link.label}
        </Link>
      )}
    </>
  )
}

export default async function ContactPage() {
  const site = await getSite()
  const desks: ContactDesk[] = site.contacts?.length
    ? site.contacts.map((c) => ({ title: c.label, text: '', email: c.email ?? undefined, phone: c.phone ?? undefined, whatsapp: c.whatsapp ?? undefined }))
    : defaultContacts

  return (
    <>
      <PageHero eyebrow="Contact Us" title="Talk to us" intro="Pick the line that fits your question and send us a message on WhatsApp." />

      <section>
        <div className="container-site grid gap-4 sm:gap-[25px] lg:grid-cols-3">
          {desks.map((desk, i) => (
            <GlassTile key={desk.title} delay={i * 80} title={desk.title} text={desk.text} art={deskArt[i % deskArt.length]} action={<DeskActions desk={desk} />} />
          ))}
        </div>
      </section>

      {/* The venue, with a map */}
      <section className="section">
        <div className="container-site">
          <Reveal className="card group grid overflow-hidden lg:grid-cols-[1fr_1.15fr]">
            <div className="relative flex flex-col justify-between gap-10 p-5 sm:p-10 lg:p-[60px]">
              <GlassArt art={glass.pin} className="!absolute top-5 right-5 w-[84px] sm:top-8 sm:right-8 sm:w-[120px]" dots="inset-[-50%]" />
              <div>
                <Label>Find us</Label>
                <h2 className="h-section mt-5">The Glory Dome</h2>
                <p className="mt-4 max-w-[420px]">{venueAddress}. Everyone is welcome, and you don’t need to register.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <MapPin width={20} height={20} /> Get directions
                </a>
                <Link href="/international" className="btn btn-outline">
                  Coming from abroad?
                </Link>
              </div>
            </div>
            <div className="relative min-h-[340px] bg-hair lg:min-h-[480px]">
              <iframe
                title="Map showing the Glory Dome, Airport Road, Abuja"
                src="https://www.google.com/maps?q=Glory+Dome+Dunamis+Abuja&z=14&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.7)]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Regular services: official posters and times */}
      <div className="section">
        <Carousel
          label="Our regular services"
          header={
            <Reveal>
              <h2 className="h-section max-w-[560px]">Worship with us any week</h2>
              <p className="mt-4 max-w-[560px]">Sunday services are at 6:30am and 9:00am. These are the other times we meet at the Glory Dome.</p>
            </Reveal>
          }
        >
          {services.map((s) => (
            <article key={s.title} className="group">
              <div className="card relative aspect-video overflow-hidden">
                <Image src={s.poster} alt={`${s.title} poster`} fill placeholder="blur" sizes="(min-width: 640px) 580px, 86vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <h3 className="h-card mt-5">{s.title}</h3>
              <p className="mt-1.5 text-base sm:text-lg">{s.when}</p>
            </article>
          ))}
        </Carousel>
      </div>

      {/* Official accounts */}
      <section className="section">
        <div className="container-site">
          <Reveal as="h2" className="h-section">
            Follow us
          </Reveal>
          <div className="mt-10 grid gap-4 sm:gap-[25px] lg:mt-[60px] lg:grid-cols-3">
            {officialAccounts.map((account, i) => (
              <Reveal key={account.name} delay={i * 80} className="card group relative flex min-h-[260px] flex-col justify-between gap-10 overflow-hidden p-5 sm:p-8">
                <GlassArt fit art={accountArt[i]} className="!absolute top-4 right-4 size-[84px] sm:size-[104px]" dots="inset-[-50%]" />
                <h3 className="h-card relative max-w-[60%]">{account.name}</h3>
                <ul className="relative flex flex-wrap gap-2.5">
                  {account.links.map((l) => {
                    const Icon = socialIcons[l.platform]
                    return (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${account.name} on ${l.platform}`} className="grid size-11 place-items-center rounded-lg bg-hair text-fg transition-colors hover:bg-gold hover:text-gold-ink">
                          <Icon width={20} height={20} />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section pb-24">
        <div className="container-site">
          <Reveal as="h2" className="h-section mx-auto max-w-[600px] text-center">
            Questions people ask
          </Reveal>
          <div className="mt-10 lg:mt-[60px]">
            <Faq items={site.faqs?.length ? site.faqs : defaultFaqs} />
          </div>
          <ShareButtons url="/contact" text="Everything you need to know about Dunamis at 30" className="mt-10 justify-center" />
        </div>
      </section>
    </>
  )
}
