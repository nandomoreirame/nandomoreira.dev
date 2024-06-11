import { env } from '@/env'
import { notion } from '@/lib/notion'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
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

  if (!links || links.length === 0) redirect('/')

  const [link] = links
  const url = link.link.url ?? '/'

  return redirect(
    `${url}${_searchParams.length > 0 ? `?${_searchParams}` : ''}`,
  )
}
