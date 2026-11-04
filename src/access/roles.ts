import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editor' | 'logistics'

type MaybeUser = { roles?: Role[] | null } | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]) =>
  Boolean(user?.roles?.some((role) => roles.includes(role)))

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

export const isEditor: Access = ({ req: { user } }) => hasRole(user, 'admin', 'editor')

export const isLogistics: Access = ({ req: { user } }) => hasRole(user, 'admin', 'logistics')

export const isStaff: Access = ({ req: { user } }) => Boolean(user)

export const anyone: Access = () => true

/** Public visitors only see approved items; editors see everything. */
export const approvedOrEditor: Access = ({ req: { user } }) => {
  if (hasRole(user, 'admin', 'editor')) return true
  return { status: { equals: 'approved' } }
}

/** Someone who asked not to be named stays unnamed everywhere outside the admin. */
export const nameIfShown: FieldAccess = ({ req: { user }, doc }) =>
  hasRole(user, 'admin', 'editor') || (doc as { showName?: boolean | null } | undefined)?.showName !== false

/** Submitter contact details are never exposed publicly. */
export const editorFieldOnly: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin', 'editor')

export const adminFieldOnly: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')
