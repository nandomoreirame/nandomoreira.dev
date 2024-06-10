import { Badge } from '@/components/badge'
import { Container } from '@/components/container'
import { PageCover } from '@/components/page-cover'
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/page-header'
import { RenderBlock } from '@/components/render-block'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain, getFileUrl, metadata } from '@/lib/utils'
import type { Block } from '@/types/notion'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'sobre',
  })

  const [title] = page.metaTitle.rich_text
  const [description] = page.metaDescription.rich_text
  const [slugText] = page.slug.rich_text
  const slug = slugText.plain_text === '/' ? '' : slugText.plain_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug,
  })
}

export default async function AboutPage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'sobre',
  })

  const { blocks } = await notion.getPageBlocks(page.id)

  const [title] = page.title.title

  return (
    <>
      <PageHeader>
        <Badge variant={'outline'}>{title.plain_text}</Badge>
        <PageTitle>indie hacker e desenvolvedor full-stack</PageTitle>
        <PageDescription>
          <NotionText richText={page.metaDescription.rich_text} />
        </PageDescription>
        <SocialLinks className="justify-center md:justify-start">
          <span className="hidden text-sm leading-tight text-muted-foreground md:inline-flex">
            Minhas redes {'->'}
          </span>
        </SocialLinks>
      </PageHeader>

      <Container className="page-content blocks pb-12">
        {page.cover && (
          <PageCover
            src={`${getFileUrl(page.cover)}`}
            pageId={page.id}
            alt={title.plain_text}
            width={1000}
            height={600}
          />
        )}

        {blocks.map((b) => {
          const block = b as unknown as Block
          return <RenderBlock key={`block-${block.id}`} block={block} />
        })}
      </Container>
    </>
  )
}
