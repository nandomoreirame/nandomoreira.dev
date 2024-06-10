'use client'

import type { MediaResponse } from '@/types/blog'
import React, { ComponentProps, useState } from 'react'

type NotionVideoProps = ComponentProps<'video'> & {
  caption?: string
  youtubeId?: string | null
  blockId?: string
}

export const NotionVideo: React.FC<NotionVideoProps> = ({
  src,
  caption,
  youtubeId,
  blockId,
  ...props
}) => {
  const [videoSrc, setVideoSrc] = useState(src)

  if (youtubeId) {
    return (
      <div className="video-wrapper">
        <iframe
          className="iframe"
          src={`https://youtube.com/embed/${youtubeId}`}
        />
        {caption && <span className="caption">{caption}</span>}
      </div>
    )
  }

  return (
    <div className="video-wrapper">
      <video
        controls
        onError={async () => {
          // eslint-disable-next-line no-console
          console.error('[error loading video]')

          if (!blockId) return

          const { media } = await fetch(
            `/api/media?blockId=${blockId}&type=video`,
          ).then((res) => res.json() as unknown as MediaResponse)

          setVideoSrc(media)
        }}
        className="video"
        {...props}
      >
        <source src={videoSrc} type="video/mp4" />
        Seu navegador não suporta a tag de vídeo.
      </video>
      {caption && <span className="caption">{caption}</span>}
    </div>
  )
}
