import type { CollectionConfig } from 'payload'

import { adminFieldOnly, hasRole, isAdmin } from '@/access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'Settings',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    // Only an admin adds users. The first-user screen on /admin works without this rule, and
    // closes for good as soon as one account exists.
    create: isAdmin,
    read: ({ req: { user } }) => {
      if (hasRole(user, 'admin')) return true
      return user ? { id: { equals: user.id } } : false
    },
    update: ({ req: { user } }) => {
      if (hasRole(user, 'admin')) return true
      return user ? { id: { equals: user.id } } : false
    },
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      saveToJWT: true,
      required: true,
      defaultValue: ['editor'],
      access: { create: adminFieldOnly, update: adminFieldOnly },
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Content editor', value: 'editor' },
        { label: 'Registration / logistics', value: 'logistics' },
      ],
      hooks: {
        beforeChange: [
          async ({ req, operation, value }) => {
            if (operation !== 'create') return value
            const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
            return totalDocs === 0 ? ['admin'] : value
          },
        ],
      },
    },
  ],
}
