'use client'

import { Icon } from '@iconify/react/offline'
import alert from '@iconify-icons/solar/danger-triangle-bold'
import check from '@iconify-icons/solar/check-circle-bold'
import close from '@iconify-icons/solar/close-circle-bold'
import info from '@iconify-icons/solar/info-circle-bold'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/** shadcn's toaster, with the dashboard's icons. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      icons={{
        success: <Icon icon={check} className="size-5 text-ink" />,
        info: <Icon icon={info} className="size-5 text-ink" />,
        warning: <Icon icon={alert} className="size-5 text-ink" />,
        error: <Icon icon={close} className="size-5 text-destructive" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': '18px',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
