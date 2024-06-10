/* eslint-disable @next/next/no-img-element */

import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain } from '@/lib/utils'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export default async function siteOG() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: '/',
  })

  const [title] = page.title.title
  const [description] = page.metaDescription.rich_text

  const clashData = await fetch(
    new URL('@/styles/fonts/CalSans-SemiBold.otf', import.meta.url),
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div tw="flex flex-col items-center w-full h-full bg-gray-200">
        <div tw="flex flex-col items-center justify-center mt-8 px-8">
          <h1 tw="text-6xl text-center font-bold text-gray-600 leading-none tracking-tight">
            {title.plain_text}
          </h1>
          <p tw="mt-4 text-xl text-gray-600 font-normal max-w-xl text-center">
            {description.plain_text}
          </p>
          <img
            tw="mt-4 w-5/6 rounded-2xl border border-gray-200 shadow-md"
            src={`${getDomain()}/images/site.png`}
            alt="Fernando Moreira - indie hacker e desenvolvedor full-stack"
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
