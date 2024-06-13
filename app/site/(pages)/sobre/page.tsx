import { Badge } from '@/components/badge'
import { Blocks } from '@/components/blocks'
import { Container } from '@/components/container'
import { Image } from '@/components/image'
import { Loader } from '@/components/loader'
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/page-header'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain, getFileUrl, metadata } from '@/lib/utils'
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

export default async function AboutPage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'sobre',
  })

  const [title] = page.title.title

  return (
    <>
      <PageHeader>
        <Badge variant={'outline'}>{title.plain_text}</Badge>
        <PageTitle>indie hacker e desenvolvedor full-stack</PageTitle>
        <PageDescription>
          <NotionText richText={page.metaDescription.rich_text} />
        </PageDescription>
        <SocialLinks className="animate-fade-in-up justify-center animate-delay-400 animate-duration-slow md:justify-start">
          <span className="hidden text-sm leading-tight text-muted-foreground md:inline-flex">
            Minhas redes {'->'}
          </span>
        </SocialLinks>
      </PageHeader>

      <Container className="blocks">
        {page.cover && (
          <div className="animate-fade-in-up animate-delay-500 animate-duration-slow">
            <Image
              src={`${getFileUrl(page.cover)}`}
              blockId={page.id}
              type="cover"
              alt={title.plain_text}
              width={1000}
              height={600}
            />
          </div>
        )}

        <Suspense fallback={<Loader />}>
          <Blocks
            size={'lg'}
            blockId={page.id}
            className="animate-fade-in-up animate-delay-700 animate-duration-slow"
          />
        </Suspense>
      </Container>
    </>
  )
}
