import { env } from '@/env'
import { notion } from '@/lib/notion'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { slug: string }
  },
) {
  const { searchParams } = new URL(request.url)
  const _searchParams = searchParams.toString()

  const { links } = await notion.getLinks({
    database_id: env.LINKS_DATABASE_ID,
    slug: params.slug,
  })

  if (!links || links.length === 0) return redirect('/')

  const [link] = links
  const url = link.link.url ?? '/'

  return redirect(
    `${url}${_searchParams.length > 0 ? `?${_searchParams}` : ''}`,
  )
}
