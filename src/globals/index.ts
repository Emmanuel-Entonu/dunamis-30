import type { Field, GlobalConfig } from 'payload'

import { anyone, isAdmin, isEditor } from '@/access/roles'

const section = (name: string, label: string, extra: Field[] = []): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    ...extra,
  ],
})

export const EventSettings: GlobalConfig = {
  slug: 'event',
  label: 'Event',
  admin: { group: 'Site content' },
  access: { read: anyone, update: isEditor },
  fields: [
    { name: 'title', type: 'text', defaultValue: '30th Anniversary Service' },
    {
      name: 'startsAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'The anniversary service date and time shown across the site. The home page timer counts down to Kingdom Power & Glory instead.' },
    },
    { name: 'dateConfirmed', type: 'checkbox', admin: { description: 'Untick to show “Date to be announced”.' } },
    { name: 'venue', type: 'text' },
    { name: 'venueConfirmed', type: 'checkbox' },
    { name: 'city', type: 'text', defaultValue: 'Lord’s Garden, Airport Road, Abuja' },
    { name: 'onlineAttendance', type: 'checkbox', defaultValue: true, label: 'The service can also be followed online' },
    { name: 'livestreamUrl', type: 'text' },
  ],
}

export const SiteSettings: GlobalConfig = {
  slug: 'site',
  label: 'Contacts & socials',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isAdmin },
  fields: [
    { name: 'officialWebsite', type: 'text', defaultValue: 'https://dunamisgospel.org' },
    {
      name: 'contacts',
      type: 'array',
      labels: { singular: 'Contact desk', plural: 'Contact desks' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'whatsapp', type: 'text', admin: { description: 'International format, digits only, e.g. 2348000000000.' } },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'platform', type: 'select', required: true, options: ['facebook', 'instagram', 'youtube', 'x', 'tiktok', 'whatsapp'] },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'faqs',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Site content' },
  access: { read: anyone, update: isEditor },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'headline', type: 'textarea' },
        { name: 'message', type: 'textarea' },
        { name: 'banner', type: 'upload', relationTo: 'media', admin: { description: 'Optional official banner/poster artwork.' } },
      ],
    },
    { name: 'welcome', type: 'textarea' },
    section('journey', 'Our journey in 30 years', [
      { name: 'stats', type: 'array', maxRows: 4, fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ] },
    ]),
    section('sons', 'Sons of the Prophet teaser'),
    section('join', 'Join the celebration'),
  ],
}

export const StoryPage: GlobalConfig = {
  slug: 'story-page',
  label: 'Our Story page',
  admin: { group: 'Site content' },
  access: { read: anyone, update: isEditor },
  fields: [
    section('beginning', 'A. The Beginning'),
    section('vision', 'B. The Vision and Mandate', [
      { name: 'coreValues', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    ]),
    section('globalImpact', 'D. Our Global Impact'),
    section('legacy', 'E. Our Legacy'),
  ],
}

export const PastorPage: GlobalConfig = {
  slug: 'pastor-page',
  label: 'Senior Pastor page',
  admin: { group: 'Site content' },
  access: { read: anyone, update: isEditor },
  fields: [
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    { name: 'fullName', type: 'text', defaultValue: 'Dr. Paul Enenche' },
    section('biography', 'A. Personal Biography'),
    section('calling', 'B. Spiritual Journey and Calling'),
    section('leadership', 'C. Ministry and Leadership'),
    section('achievements', 'D. Ministry Achievements and Milestones', [
      { name: 'items', type: 'array', fields: [
        { name: 'year', type: 'text' },
        { name: 'text', type: 'text', required: true },
      ] },
    ]),
    section('family', 'E. Family and Personal Life'),
    {
      name: 'videos',
      label: 'F. Messages and Video Highlights',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'kind', type: 'select', options: ['sermon', 'interview', 'documentary', 'moment'] },
      ],
    },
  ],
}

export const ImpactPage: GlobalConfig = {
  slug: 'impact-page',
  label: '30 Years of Impact page',
  admin: { group: 'Site content' },
  access: { read: anyone, update: isEditor },
  fields: [
    { name: 'intro', type: 'textarea' },
    {
      name: 'stats',
      type: 'array',
      admin: { description: 'Approved figures only.' },
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text', admin: { description: 'e.g. “+”, “M+”' } },
        { name: 'label', type: 'text', required: true },
      ],
    },
    {
      name: 'stories',
      type: 'array',
      labels: { singular: 'Impact area', plural: 'Impact areas' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'videoUrl', type: 'text' },
      ],
    },
  ],
}

export const globals = [EventSettings, Homepage, StoryPage, PastorPage, ImpactPage, SiteSettings]
