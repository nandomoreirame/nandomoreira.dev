import { env } from '@/env'
import type {
  FileBlock,
  FileExternalBlock,
  FileFileBlock,
  ImageBlock,
  VideoBlock,
} from '@/types/notion'
import { clsx, type ClassValue } from 'clsx'
import slugify from 'slugify'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function titleToSlug(title: string) {
  return slugify(title, {
    replacement: '-',
    lower: true,
    strict: true,
    trim: true,
  })
}

export function getDomain(subdomain?: string) {
  const sub = subdomain ? `${subdomain}.` : ''
  const http = `http${env.NEXT_PUBLIC_NODE_ENV === 'production' ? 's' : ''}://`
  return `${http}${sub}${env.NEXT_PUBLIC_ROOT_DOMAIN}`
}

export function getSubDomain(domain: string, path = '') {
  const http = `http${env.NEXT_PUBLIC_NODE_ENV === 'production' ? 's' : ''}://`
  return domain
    .replaceAll(http, '')
    .replaceAll(`.${env.NEXT_PUBLIC_ROOT_DOMAIN}${path}`, '')
}

export const getMediaProperties = (block: ImageBlock | VideoBlock) => {
  const source = block.type === 'external' ? block.external.url : block.file.url
  const caption =
    block.caption && block.caption.length > 0 ? block.caption[0].plain_text : ''
  return { source, caption }
}

export const extractYoutubeId = (url: string): string | null => {
  const matched = url.match(
    /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\\&\\?]*).*/,
  )
  return matched && matched.length >= 1 ? matched[1] : null
}

export const getFileUrl = (block: FileBlock) => {
  if (block.type === 'file') {
    return (block as FileFileBlock).file.url
  }

  if (block.type === 'external') {
    return (block as FileExternalBlock).external.url
  }

  return ''
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const truncate = (str: string, num: number) => {
  if (!str) return ''
  if (str.length <= num) return str
  return str.slice(0, num) + '...'
}

export function readingTime(text: string) {
  const words = text.split(/\s+/).length
  const wpm = 200
  const minutesToRead = Math.ceil(words / wpm)
  const secondsToRead = Math.ceil(words / (wpm / 60))
  const characters = text.length

  return { words, minutesToRead, characters, secondsToRead }
}

export function metadata({
  title,
  description,
  slug,
  baseUrl,
  siteName = 'nandomoreira.dev',
  article,
}: {
  title: string
  description: string
  slug: string
  baseUrl: string
  siteName?: string
  article?: {
    section?: string
    publishedTime?: string
    authors?: string[]
  }
}) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: article ? 'article' : 'website',
      siteName,
      locale: 'pt_BR',
      publishedTime: article ? article.publishedTime : undefined,
      authors: article ? article.authors : undefined,
      section: article ? article.section : undefined,
      url: `${baseUrl}/${slug}`,
      images: [
        {
          url: `${baseUrl}${article ? `/${slug}` : ''}/opengraph-image`,
          width: 1200,
          height: 600,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@oseunando',
    },
    alternates: { canonical: `/${slug}` },
  }
}
