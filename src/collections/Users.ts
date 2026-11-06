import type { CollectionConfig } from 'payload'

import { adminFieldOnly, hasRole, isAdmin } from '@/access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  // Only ever seen at the top of someone's own account page.
  labels: { singular: 'Account', plural: 'Account' },
  admin: {
    hidden: true,
    useAsTitle: 'username',
    defaultColumns: ['name', 'username', 'roles'],
    group: 'Settings',
  },
  auth: {
    // https only on the live site. A local server runs on plain http, where the cookie would be refused.
    cookies: { secure: Boolean(process.env.VERCEL), sameSite: 'Lax' },
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // People sign in with a username. The first account was made with an email, and that keeps working.
    loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false },
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
      // Not on the account page, where someone could remove their own access by accident.
      admin: { hidden: true },
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
