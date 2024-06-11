import { AuthorAvatar } from '@/components/author-avatar'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { cn, getDomain, metadata } from '@/lib/utils'
import { Mail, NotebookText } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'lab',
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

export default async function LabPage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'lab',
  })

  const [title] = page.title.title

  return (
    <Container
      size={'sm'}
      className={cn(
        'flex flex-col items-center justify-between md:min-h-[400px]',
      )}
    >
      <div className="grid gap-4">
        <AuthorAvatar size="md" />

        <div className="mt-6">
          <Badge variant={'outline'}>Em breve!</Badge>
          <h1 className="mb-6 mt-2 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
            {title.plain_text}
          </h1>
          <h2 className="mb-3 block font-sans text-xl font-normal md:text-2xl">
            <NotionText richText={page.description.rich_text} />
          </h2>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <Button asChild>
            <Link href="/contato" className="w-full xs:w-auto">
              <Mail className="size-4" />
              <span>contato</span>
            </Link>
          </Button>

          <Button variant={'ghost'} asChild>
            <Link href="/blog" className="w-full xs:w-auto">
              <NotebookText className="size-4" />
              <span>blog</span>
            </Link>
          </Button>

          <div>
            <SocialLinks />
          </div>
        </div>
      </div>
    </Container>
  )
}
