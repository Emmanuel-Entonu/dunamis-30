import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isEditor, isStaff } from '@/access/roles'

export const Milestones: CollectionConfig = {
  slug: 'milestones',
  admin: {
    hidden: true,
    useAsTitle: 'title',
    defaultColumns: ['year', 'title', 'category'],
    group: 'Media & Archive',
    description: 'The “Journey Through the Years” timeline on Our Story.',
  },
  defaultSort: 'year',
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { type: 'row', fields: [
      { name: 'year', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'dateLabel', type: 'text', admin: { description: 'Optional, e.g. “March 1996”.' } },
    ] },
    { name: 'title', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Beginnings', value: 'beginnings' },
        { label: 'Growth', value: 'growth' },
        { label: 'Expansion & branches', value: 'expansion' },
        { label: 'Conventions & programmes', value: 'conventions' },
        { label: 'International', value: 'international' },
        { label: 'Facilities', value: 'facilities' },
        { label: 'Breakthroughs', value: 'breakthroughs' },
      ],
    },
    { name: 'description', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'videoUrl', type: 'text' },
  ],
}

export const GalleryItems: CollectionConfig = {
  slug: 'gallery',
  labels: { singular: 'Gallery item', plural: 'Media gallery' },
  admin: {
    hidden: true,
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'category', 'event'],
    group: 'Media & Archive',
  },
  defaultSort: '-year',
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: 'title', type: 'text', required: true },
    { type: 'row', fields: [
      { name: 'year', type: 'number', index: true },
      { name: 'event', type: 'text', index: true },
    ] },
    {
      name: 'category',
      type: 'select',
      index: true,
      options: [
        { label: 'Historical photographs', value: 'historical' },
        { label: 'Old church photographs', value: 'old-church' },
        { label: 'Major conventions', value: 'conventions' },
        { label: 'Significant ministry events', value: 'events' },
        { label: 'Moments with the Senior Pastor', value: 'pastor' },
        { label: 'Ministry expansion', value: 'expansion' },
        { label: 'International events', value: 'international' },
        { label: 'Anniversary promotional videos', value: 'promo' },
        { label: 'Documentaries and interviews', value: 'documentaries' },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'videoUrl', type: 'text' },
    { name: 'description', type: 'textarea' },
  ],
}

/** One row per downloaded/shared social card — powers the “monitor card generation” stats. */
export const CardEvents: CollectionConfig = {
  slug: 'card-events',
  labels: { singular: 'Social card event', plural: 'Social card activity' },
  admin: {
    hidden: true,
    defaultColumns: ['template', 'format', 'action', 'country', 'createdAt'],
    group: 'Registrations',
  },
  access: { read: isStaff, create: isAdmin, update: () => false, delete: isAdmin },
  fields: [
    { name: 'template', type: 'text', index: true },
    { name: 'format', type: 'text' },
    { name: 'action', type: 'select', options: ['download', 'share'], index: true },
    { name: 'country', type: 'text' },
  ],
}
