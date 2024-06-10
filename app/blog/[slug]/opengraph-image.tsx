/* eslint-disable @next/next/no-img-element */

import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getFileUrl } from '@/lib/utils'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export default async function PostOG({ params }: { params: { slug: string } }) {
  const result = await notion.getPost({
    database_id: env.BLOG_DATABASE_ID,
    slug: decodeURIComponent(params.slug),
  })

  if (!result) {
    return new Response('Not found', { status: 404 })
  }

  const [title] = result.post.title.title
  const [description] = result.post.description.rich_text
  const [author] = result.post.author.people

  const clashData = await fetch(
    new URL('@/styles/fonts/CalSans-SemiBold.otf', import.meta.url),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center w-full h-full bg-background">
        <div tw="flex flex-col items-center justify-center mt-8 px-8">
          <h1 tw="text-6xl text-center font-bold text-foreground leading-none tracking-tight">
            {title.plain_text}
          </h1>
          <p tw="mt-4 text-xl text-gray-600 max-w-xl text-center">
            {description.plain_text}
          </p>
          <div tw="flex items-center justify-center">
            <img
              tw="w-12 h-12 rounded-full mr-4"
              src={author.avatar_url as string}
              alt={author.name as string}
            />
            <p tw="text-xl font-medium text-gray-900">por {author.name}</p>
          </div>
          <img
            tw="mt-4 w-5/6 rounded-2xl border border-gray-200 shadow-md"
            src={getFileUrl(result.post.cover)}
            alt={title.plain_text}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 600,
      fonts: [
        {
          name: 'Clash',
          data: clashData,
        },
      ],
      emoji: 'blobmoji',
    },
  )
}
