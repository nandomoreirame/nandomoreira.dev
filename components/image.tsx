'use client'

import { cn } from '@/lib/utils'
import type { MediaResponse } from '@/types/blog'
import NextImage from 'next/image'
import Link from 'next/link'
import { ComponentProps, useState } from 'react'
import { DialogContent, DialogRoot, DialogTrigger } from './dialog'

type NotionImageProps = ComponentProps<typeof NextImage> & {
  caption?: string
  blockId?: string
}

export function NotionImage({
  src,
  caption,
  blockId,
  className,
  ...props
}: NotionImageProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setLoading] = useState(true)

  const placeholderBlurhash =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoJJREFUWEfFl4lu4zAMRO3cx/9/au6reMaOdkxTTl0grQFCRoqaT+SQotq2bV9N8rRt28xms87m83l553eZ/9vr9Wpkz+ezkT0ej+6dv1X81AFw7M4FBACPVn2c1Z3zLgDeJwHgeLFYdAARYioAEAKJEG2WAjl3gCwNYymQQ9b7/V4spmIAwO6Wy2VnAMikBWlDURBELf8CuN1uHQSrPwMAHK5WqwFELQ01AIXdAa7XawfAb3p6AOwK5+v1ugAoEq4FRSFLgavfQ49jAGQpAE5wjgGCeRrGdBArwHOPcwFcLpcGU1X0IsBuN5tNgYhaiFFwHTiAwq8I+O5xfj6fOz38K+X/fYAdb7fbAgFAjIJ6Aav3AYlQ6nfnDoDz0+lUxNiLALvf7XaDNGQ6GANQBKR85V27B4D3QQRw7hGIYlQKWGM79hSweyCUe1blXhEAogfABwHAXAcqSYkxCtHLUK3XBajSc4Dj8dilAeiSAgD2+30BAEKV4GKcAuDqB4TdYwBgPQByCgApUBoE4EJUGvxUjF3Q69/zLw3g/HA45ABKgdIQu+JPIyDnisCfAxAFNFM0EFNQ64gfS0EUoQP8ighrZSjn3oziZEQpauyKbfjbZchHUL/3AS/Dd30gAkxuRACgfO+EWQW8qwI1o+wseNuKcQiESjALvwNoMI0TcRzD4lFcPYwIM+JTF5x6HOs8yI7jeB5oKhpMRFH9UwaSCDB2Jmg4rc6E2TT0biIaG0rQhNqyhpHBcayTTSXH6vcDL7/sdqRK8LkwTsU499E8vRcAojHcZ4AxABdilgrp4lsXk8oVqgwh7+6H3phqd8J0Kk4vbx/+sZqCD/vNLya/5dT9fAH8g1WdNGgwbQAAAABJRU5ErkJggg=='

  function Image({
    className,
    ...imageProps
  }: Omit<ComponentProps<typeof NextImage>, 'src' | 'alt'>) {
    return (
      <NextImage
        {...imageProps}
        src={imageSrc}
        alt={props.alt}
        quality={60}
        blurDataURL={placeholderBlurhash}
        className={cn('image', isLoading ? 'blur-lg' : 'blur-0', className)}
        placeholder="blur"
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={async () => {
          if (!blockId) return
          setLoading(true)
          const { media } = await fetch(
            `/api/media?blockId=${blockId}&type=image`,
          ).then((res) => res.json() as unknown as MediaResponse)
          setImageSrc(media)
          setLoading(false)
        }}
      />
    )
  }

  return (
    <figure id={`image-${blockId}`} className="figure">
      <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Link
            href={`#image-${blockId}`}
            onClick={(e) => {
              e.preventDefault()
              setIsOpen(true)
            }}
          >
            <Image {...props} />
          </Link>
        </DialogTrigger>
        <DialogContent className="fixed inset-0 z-999 w-screen overflow-y-auto">
          <div className="flex min-h-full w-full items-center justify-center p-4 text-center sm:p-0">
            <div className="overflow-auto p-12 md:max-w-screen-xl">
              <Image
                {...props}
                width={1200}
                height={1200}
                className="translate-y-[100%] transform animate-[appear_500ms_cubic-bezier(0.4,_0,_0.2,_1)_500ms_both] rounded-none opacity-0 transition-all"
              />
            </div>
          </div>
        </DialogContent>
      </DialogRoot>
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  )
}
