'use client'

import { useBoolean } from '@/hooks/useBoolean'
import { cn } from '@/lib/utils'
import type { MediaResponse } from '@/types/blog'
import NextImage from 'next/image'
import { ComponentProps, useEffect, useState } from 'react'
import ImageZoom from 'react-medium-image-zoom'

type ImageProps = ComponentProps<typeof NextImage> & {
  caption?: string
  blockId?: string
  type?: 'cover' | 'image'
  zoom?: boolean
}

export function Image({
  caption,
  blockId,
  className,
  type = 'image',
  zoom = false,
  ...props
}: ImageProps): JSX.Element {
  const { value: isLoading, setValue: setLoading } = useBoolean(false)
  const [src, setSrc] = useState(props.src)

  // update the `src` value when the `prop.src` value changes
  useEffect(() => setSrc(props.src), [props.src])

  async function handleError() {
    if (!blockId) return
    setLoading(true)

    const urlType = type === 'cover' ? `/page?pageId` : `/media?blockId`
    const { media } = await fetch(
      `/api${urlType}=${blockId}&type=${type}`,
    ).then((res) => res.json() as unknown as MediaResponse)

    setSrc(media)
    setLoading(false)
  }

  function ImageComp() {
    return (
      <NextImage
        {...props}
        src={src}
        alt={props.alt}
        quality={60}
        width={props?.width ?? 100}
        height={props?.height ?? 100}
        className={cn(
          'image',
          isLoading
            ? 'scale-110 opacity-50 blur-sm'
            : 'scale-100 opacity-100 blur-0',
          'transform transition-all duration-700 ease-in-out',
          className,
        )}
        onLoad={() => setLoading(false)}
        onError={async () => await handleError()}
        priority={type === 'cover'}
        loading={type === 'image' ? 'lazy' : undefined}
        unoptimized
      />
    )
  }

  return (
    <figure
      id={`image-${blockId}`}
      className={cn(type === 'cover' ? type : 'figure')}
    >
      {zoom && (
        <ImageZoom>
          <ImageComp />
        </ImageZoom>
      )}
      {!zoom && <ImageComp />}
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  )
}
