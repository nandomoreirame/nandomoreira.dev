import { Loader } from '@/components/loader'
import { Page } from '@/components/page'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain, metadata } from '@/lib/utils'
import { Suspense } from 'react'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'sobre',
  })

  if (!page) return {}

  const [title] = page.metaTitle.rich_text
  const [description] = page.metaDescription.rich_text
  const [slug] = page.slug.rich_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug: slug.plain_text,
  })
}

export default function AboutPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Page
        slug="sobre"
        pageBadge={'sobre'}
        pageTitle={<>front-end e desenvolvedor full-stack</>}
      />
    </Suspense>
  )
}
