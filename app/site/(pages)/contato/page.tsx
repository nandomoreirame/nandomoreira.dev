import { Badge } from '@/components/badge'
import { Blocks } from '@/components/blocks'
import { Container } from '@/components/container'
import { Loader } from '@/components/loader'
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/page-header'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { getDomain, metadata } from '@/lib'
import { notion } from '@/lib/notion'
import { Suspense } from 'react'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'contato',
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

export default async function ContactPage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'contato',
  })

  const [title] = page.title.title
  const description = page.description

  return (
    <>
      <PageHeader>
        <Badge variant={'outline'}>{title.plain_text}</Badge>
        <PageTitle>
          E ai! bão <span className="text-primary">ou não?</span>
          {/* <NotionText richText={page.metaDescription.rich_text} /> */}
        </PageTitle>
        {description && (
          <PageDescription>
            <NotionText richText={description?.rich_text} />
          </PageDescription>
        )}
        <SocialLinks className="animate-fade-in-up animate-delay-400 animate-duration-slow" />
      </PageHeader>

      <Container
        size={'sm'}
        className="animate-fade-in-up pb-12 animate-delay-500 animate-duration-slow"
      >
        {/* TODO: contact form */}[ TODO - contact form ]
      </Container>

      <Suspense fallback={<Loader />}>
        <Blocks
          blockId={page.id}
          className="animate-fade-in-up animate-delay-700 animate-duration-slow"
        />
      </Suspense>
    </>
  )
}
