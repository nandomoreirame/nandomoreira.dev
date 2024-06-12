import { Badge } from '@/components/badge'
import { Container } from '@/components/container'
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/page-header'
import { RenderBlock } from '@/components/render-block'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { getDomain, metadata } from '@/lib'
import { notion } from '@/lib/notion'
import type { Block } from '@/types/notion'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'contato',
  })

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

  const { blocks } = await notion.getPageBlocks(page.id)

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

      <div className="blocks animate-fade-in-up pb-12 animate-delay-700 animate-duration-slow">
        {blocks.map((b) => {
          const block = b as unknown as Block
          return <RenderBlock key={`block-${block.id}`} block={block} />
        })}
      </div>
    </>
  )
}
