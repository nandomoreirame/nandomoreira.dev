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
  const [slugText] = page.slug.rich_text
  const slug = slugText.plain_text === '/' ? '' : slugText.plain_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug,
  })
}

export default async function ContactPage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'contato',
  })

  const { blocks } = await notion.getPageBlocks(page.id)

  const [title] = page.title.title

  return (
    <>
      <PageHeader>
        <Badge variant={'outline'}>{title.plain_text}</Badge>
        <PageTitle>
          E ai! bão <span className="text-primary">ou não?</span>
          {/* <NotionText richText={page.metaDescription.rich_text} /> */}
        </PageTitle>
        <PageDescription>
          <NotionText richText={page.metaDescription.rich_text} />
        </PageDescription>
        <SocialLinks />
      </PageHeader>

      <Container size={'sm'} className="pb-12">
        {/* TODO: contact form */}[ TODO - contact form ]
      </Container>

      <div className="blocks">
        {blocks.map((b) => {
          const block = b as unknown as Block
          return <RenderBlock key={`block-${block.id}`} block={block} />
        })}
      </div>
    </>
  )
}
