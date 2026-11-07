'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

/** A photo someone sent in. Those have no blurred preview, so a skeleton holds the space until it arrives. */
export function LoadingImage({ alt, className = '', onLoad, onError, ...props }: ImageProps) {
  const [settled, setSettled] = useState(false)
  const waiting = !settled && props.placeholder !== 'blur'
  return (
    <Image
      {...props}
      alt={alt}
      className={`${waiting ? 'photo-wait ' : ''}${className}`}
      onLoad={(event) => {
        setSettled(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        setSettled(true)
        onError?.(event)
      }}
    />
  )
}
