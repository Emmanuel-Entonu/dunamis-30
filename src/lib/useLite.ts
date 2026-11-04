'use client'

import { useSyncExternalStore } from 'react'

import { isLite, onLiteChange } from './lite'

/** Whether this visit is on the lighter version of the site. See `lite.ts`. */
export const useLite = () => useSyncExternalStore(onLiteChange, isLite, () => false)
