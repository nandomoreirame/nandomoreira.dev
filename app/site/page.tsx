import { AuthorAvatar } from '@/components/author-avatar'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { RenderBlock } from '@/components/render-block'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { cn, getDomain, metadata } from '@/lib/utils'
import type { Block } from '@/types/notion'
import { Mail, NotebookText, User } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'home',
  })

  const [title] = page?.metaTitle.rich_text
  const [description] = page?.metaDescription.rich_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug: 'home',
  })
}

export default async function HomePage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'home',
  })

  const { blocks } = await notion.getPageBlocks(page.id)
  const [title] = page.title.title

  return (
    <Container
      size={'sm'}
      className={cn(
        'flex flex-col items-center justify-between md:min-h-[400px]',
      )}
    >
      <div className="relative m-auto flex max-w-4xl flex-col items-center gap-12 text-center md:flex-row md:text-left">
        <Link href="/sobre">
          <AuthorAvatar size="lg" />
        </Link>
        <div className="grid gap-4">
          <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
            {title.plain_text}
          </h1>

          <h2 className="block text-xl md:text-2xl">
            <NotionText richText={page.description.rich_text} />
          </h2>

          <div>
            {blocks.map((b) => {
              const block = b as unknown as Block
              return <RenderBlock key={`block-${block.id}`} block={block} />
            })}
          </div>

          <div className="mt-4 flex flex-col justify-center gap-4 md:mt-0 md:flex-row md:gap-2">
            <Button asChild>
              <Link href="/contato" className="w-full xs:w-auto">
                <Mail className="size-4" />
                <span>contato</span>
              </Link>
            </Button>

            <Button variant={'ghost'} asChild>
              <Link href="/sobre" className="w-full xs:w-auto">
                <User className="size-4" />
                <span>sobre</span>
              </Link>
            </Button>

            <Button variant={'ghost'} asChild>
              <Link href="/blog" className="w-full xs:w-auto">
                <NotebookText className="size-4" />
                <span>blog</span>
              </Link>
            </Button>

            <SocialLinks className="mt-4 justify-center md:mt-0 md:justify-start" />
          </div>
        </div>
      </div>
    </Container>
  )
}
