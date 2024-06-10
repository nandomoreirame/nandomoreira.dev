'use client'

import { cn } from '@/lib/utils'
import type { MediaResponse } from '@/types/blog'
import NextImage from 'next/image'
import { ComponentProps, useState } from 'react'

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
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setLoading] = useState(true)

  const placeholderBlurhash =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoJJREFUWEfFl4lu4zAMRO3cx/9/au6reMaOdkxTTl0grQFCRoqaT+SQotq2bV9N8rRt28xms87m83l553eZ/9vr9Wpkz+ezkT0ej+6dv1X81AFw7M4FBACPVn2c1Z3zLgDeJwHgeLFYdAARYioAEAKJEG2WAjl3gCwNYymQQ9b7/V4spmIAwO6Wy2VnAMikBWlDURBELf8CuN1uHQSrPwMAHK5WqwFELQ01AIXdAa7XawfAb3p6AOwK5+v1ugAoEq4FRSFLgavfQ49jAGQpAE5wjgGCeRrGdBArwHOPcwFcLpcGU1X0IsBuN5tNgYhaiFFwHTiAwq8I+O5xfj6fOz38K+X/fYAdb7fbAgFAjIJ6Aav3AYlQ6nfnDoDz0+lUxNiLALvf7XaDNGQ6GANQBKR85V27B4D3QQRw7hGIYlQKWGM79hSweyCUe1blXhEAogfABwHAXAcqSYkxCtHLUK3XBajSc4Dj8dilAeiSAgD2+30BAEKV4GKcAuDqB4TdYwBgPQByCgApUBoE4EJUGvxUjF3Q69/zLw3g/HA45ABKgdIQu+JPIyDnisCfAxAFNFM0EFNQ64gfS0EUoQP8ighrZSjn3oziZEQpauyKbfjbZchHUL/3AS/Dd30gAkxuRACgfO+EWQW8qwI1o+wseNuKcQiESjALvwNoMI0TcRzD4lFcPYwIM+JTF5x6HOs8yI7jeB5oKhpMRFH9UwaSCDB2Jmg4rc6E2TT0biIaG0rQhNqyhpHBcayTTSXH6vcDL7/sdqRK8LkwTsU499E8vRcAojHcZ4AxABdilgrp4lsXk8oVqgwh7+6H3phqd8J0Kk4vbx/+sZqCD/vNLya/5dT9fAH8g1WdNGgwbQAAAABJRU5ErkJggg=='

  return (
    <figure className="figure">
      <NextImage
        {...props}
        src={imageSrc}
        alt={props.alt}
        quality={60}
        blurDataURL={placeholderBlurhash}
        className={cn('image', isLoading ? 'blur-lg' : 'blur-0', className)}
        placeholder="blur"
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={async () => {
          // eslint-disable-next-line no-console
          console.error('[error loading image]')

          if (!blockId) return

          const { media } = await fetch(
            `/api/media?blockId=${blockId}&type=image`,
          ).then((res) => res.json() as unknown as MediaResponse)

          setImageSrc(media)
        }}
      />
      {caption && <figcaption className="caption">{caption}</figcaption>}
    </figure>
  )
}
