'use client'

import { useBoolean } from '@/hooks/useBoolean'
import { cn } from '@/lib/utils'
import type { MediaResponse } from '@/types/blog'
import React, { ComponentProps, useState } from 'react'
import { Loader } from './loader'

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
  const { value: isLoading, setValue: setLoading } = useBoolean(false)
  const [videoSrc, setVideoSrc] = useState(src)

  if (youtubeId) {
    return (
      <div className="video-wrapper">
        <div
          className={cn(
            'fixed bottom-0 top-0 z-999 flex size-full items-center justify-center bg-slate-900',
            isLoading ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Loader>carregando video, aguarde...</Loader>
        </div>
        <iframe
          className="iframe"
          src={`https://youtube.com/embed/${youtubeId}`}
          onLoad={async () => setLoading(false)}
        />
        {caption && <span className="caption">{caption}</span>}
      </div>
    )
  }

  return (
    <div className="video-wrapper">
      <div
        className={cn(
          'fixed bottom-0 top-0 z-999 flex size-full items-center justify-center bg-slate-900',
          isLoading ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Loader>carregando video, aguarde...</Loader>
      </div>
      <video
        controls
        onLoad={async () => setLoading(false)}
        onError={async () => {
          if (!blockId) return
          setLoading(true)
          const { media } = await fetch(
            `/api/media?blockId=${blockId}&type=video`,
          ).then((res) => res.json() as unknown as MediaResponse)
          setVideoSrc(media)
          setLoading(false)
        }}
        className={cn('video', isLoading ? 'opacity-0' : 'opacity-100')}
        {...props}
      >
        <source src={videoSrc} type="video/mp4" />
        Seu navegador não suporta a tag de vídeo.
      </video>
      {caption && <span className="caption">{caption}</span>}
    </div>
  )
}
