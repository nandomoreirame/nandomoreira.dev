import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain, getFileUrl } from '@/lib/utils'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const contentType = 'image/png'
export const size = { width: 1200, height: 600 }

export default async function OpengraphImage({
  params,
}: {
  params: { type: string; slug: string }
}) {
  const type = params.type
  const slug = params.slug

  let title = ''
  let description = ''
  let author
  let cover

  const revalidateTag = `opengraph-${type}-${new Date().getTime().toString()}`

  if (type === 'page') {
    const { page } = await notion.getPage({
      database_id: env.PAGES_DATABASE_ID,
      revalidateTag,
      slug,
    })

    if (!page) {
      return new Response('Not found', { status: 404 })
    }

    title = page.title.title[0].plain_text
    description = page.metaDescription.rich_text[0].plain_text
  } else if (type === 'article') {
    const post = await notion.getSinglePost({
      database_id: env.BLOG_DATABASE_ID,
      revalidateTag,
      slug,
    })

    if (!post) {
      return new Response('Not found', { status: 404 })
    }

    title = post.title.title[0].plain_text
    description = post.description.rich_text[0].plain_text
    author = post.author.people[0]
    cover = post.cover
  }

  const clashData = await fetch(
    new URL('@/styles/fonts/CalSans-SemiBold.otf', import.meta.url),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center w-full h-full bg-gray-200">
        <div tw="flex flex-col items-center justify-center mt-8 px-8">
          {title && (
            <h1 tw="text-6xl text-center font-bold text-black leading-none tracking-tight">
              {title}
            </h1>
          )}

          {description && (
            <p tw="mt-4 text-xl text-gray-600 max-w-xl text-center">
              {description}
            </p>
          )}

          {author && (
            <div tw="flex items-center justify-center">
              <img
                tw="w-12 h-12 rounded-full mr-4"
                src={author.avatar_url as string}
                alt={author.name as string}
              />
              <p tw="text-xl font-medium text-gray-900">por {author.name}</p>
            </div>
          )}

          {cover && (
            <img
              tw="mt-4 w-5/6 rounded-2xl border border-gray-200 shadow-md"
              src={getFileUrl(cover)}
              alt={title}
            />
          )}

          {type === 'page' && (
            <img
              tw="mt-4 w-5/6 rounded-2xl border border-gray-200 shadow-md"
              src={`${getDomain()}/images/site.png`}
              alt="Fernando Moreira - indie hacker e desenvolvedor full-stack"
            />
          )}
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
