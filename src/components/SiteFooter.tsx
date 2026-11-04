import Link from '@/components/SiteLink'

import { renders } from '@/assets/renders'
import { getSite } from '@/lib/content'
import { defaultContacts, venueAddress, whatsappLink } from '@/lib/ministry'
import { navItems, tagline } from '@/lib/site'
import { socialIcons } from './icons'
import { GlassImage } from './GlassImage'
import { Logo } from './Logo'
import { Marquee } from './Reveal'

const takePart = [
  { href: '/social-card', label: 'I Am Attending' },
  { href: '/international', label: 'International Guests' },
  { href: '/testimonies#share', label: 'Share Your Testimony' },
  { href: '/sons-of-the-prophet#share', label: 'Share Your Story' },
  { href: '/contact', label: 'Contact Us' },
]

const explore = navItems.filter((n) => n.href !== '/' && !takePart.some((t) => t.href === n.href))

export async function SiteFooter() {
  const site = await getSite()
  const contacts = site.contacts ?? []

  return (
    <footer className="relative isolate overflow-hidden">
      <div className="bg-white/[0.03] py-5 backdrop-blur-[5px]">
        <Marquee
          items={['One ministry', 'Thirty years', 'Millions of stories', 'One continuing legacy']}
          itemClassName="text-base font-bold text-soft uppercase sm:text-lg"
        />
      </div>

      <div aria-hidden className="flare absolute inset-x-0 bottom-0 -z-10 h-[420px] opacity-60" />
      <GlassImage
        lazy
        src={renders.glassTube}
        className="pointer-events-none absolute -bottom-16 -left-28 -z-10 hidden w-[300px] rotate-[66deg] opacity-90 md:block"
      />
      <GlassImage
        lazy
        src={renders.glassTube}
        className="pointer-events-none absolute top-16 -right-28 -z-10 hidden w-[300px] rotate-[-113deg] opacity-90 md:block"
      />

      <div className="footer-top container-site pt-20 pb-10 lg:pt-[140px]">
        <div className="flex flex-col gap-14 lg:flex-row lg:justify-between lg:gap-[90px]">
          <div className="lg:max-w-[450px]">
            <Logo size="lg" />
            <p className="mt-6 text-base sm:text-lg">{tagline}</p>
            {contacts.length === 0 && (
              <p className="mt-6 text-base">
                {venueAddress}
                <br />
                WhatsApp:{' '}
                <a className="text-fg hover:text-gold" href={whatsappLink(defaultContacts[0].whatsapp!)} target="_blank" rel="noopener noreferrer">
                  {defaultContacts[0].whatsapp}
                </a>
              </p>
            )}
            {contacts.length > 0 && (
              <ul className="mt-6 grid gap-1 text-base">
                {contacts.map((c) => (
                  <li key={c.id ?? c.label}>
                    {c.label}:{' '}
                    {c.email && (
                      <a className="text-fg hover:text-gold" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a className="ml-2 text-fg hover:text-gold" href={`tel:${c.phone.replace(/\s/g, '')}`}>
                        {c.phone}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:flex sm:gap-[90px]">
            <nav aria-label="Explore">
              <p className="text-lg font-semibold text-gold sm:text-xl">Explore</p>
              <ul className="mt-4">
                {explore.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-2 text-base transition-colors hover:text-fg sm:text-lg">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Take part">
              <p className="text-lg font-semibold text-gold sm:text-xl">Take Part</p>
              <ul className="mt-4">
                {takePart.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-2 text-base transition-colors hover:text-fg sm:text-lg">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-6 border-t border-white/20 pt-8 sm:mt-[90px] sm:flex-row sm:items-center sm:justify-between sm:pt-10">
          <p className="text-sm sm:text-base">
            © {new Date().getFullYear()} Dunamis International Gospel Centre ·{' '}
            <a href={site.officialWebsite} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
              Official Website
            </a>{' '}
            ·{' '}
            <Link href="/privacy" className="hover:text-fg">
              Privacy
            </Link>{' '}
            ·{' '}
            <Link href="/terms" className="hover:text-fg">
              Terms
            </Link>
          </p>
          <ul className="flex gap-4" aria-label="Official social media">
            {site.socials.map((s) => {
              const Icon = socialIcons[s.platform]
              return (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="block text-fg transition-transform hover:-translate-y-[3px] hover:text-gold"
                  >
                    <Icon width={28} height={28} />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </footer>
  )
}
