import { AuthorAvatar } from '@/components/author-avatar'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getPlaceholderImage } from '@/lib/sharp'
import { getDomain, metadata } from '@/lib/utils'
import { Home, Mail, NotebookText, User } from 'lucide-react'
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
  const image = '/images/fernando-moreira-linhas-amarelas.webp'
  const { src, placeholder } = await getPlaceholderImage(image)

  return (
    <Container size={'sm'}>
      <div className="relative m-auto mb-6 flex max-w-4xl flex-col items-center gap-2 text-center md:items-start md:text-left">
        <Link
          href="/sobre"
          className="animate-fade-in-up animate-delay-100 animate-duration-slow"
        >
          <AuthorAvatar
            src={src}
            alt="foto de Fernando Moreira - indie hacker e desenvolvedor full-stack"
            placeholder="blur"
            blurDataURL={placeholder}
            size="md"
          />
        </Link>

        <div className="grid gap-2">
          <div>
            <Badge
              variant={'outline'}
              className="animate-fade-in-up animate-delay-200 animate-duration-slow"
            >
              Em breve!
            </Badge>
            <h1 className="mb-6 mt-2 animate-fade-in-up text-2xl font-extrabold leading-tight animate-delay-300 animate-duration-slow sm:text-3xl md:text-4xl">
              {title.plain_text}
            </h1>
            <h2 className="mb-3 block animate-fade-in-up font-sans text-xl font-normal animate-delay-400 animate-duration-slow md:text-2xl">
              <NotionText richText={page.description.rich_text} />
            </h2>
          </div>

          <div className="mt-4 flex animate-fade-in-up flex-col justify-center gap-4 animate-delay-500 animate-duration-slow md:mt-0 md:flex-row md:justify-start md:gap-2">
            <Button variant={'ghost'} asChild>
              <Link href="/" className="w-full xs:w-auto">
                <Home className="size-4" />
                <span>home</span>
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

            <Button asChild>
              <Link href="/contato" className="w-full xs:w-auto">
                <Mail className="size-4" />
                <span>contato</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
