import { AuthorAvatar } from '@/components/author-avatar'
import { Blocks } from '@/components/blocks'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { Loader } from '@/components/loader'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getPlaceholderImage } from '@/lib/sharp'
import { getDomain, metadata } from '@/lib/utils'
import { FlaskConical, Mail, NotebookText, User } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'home',
  })

  if (!page) return {}

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

  const [title] = page.title.title

  const image = '/images/fernando-moreira-linhas-amarelas.webp'
  const { src, placeholder } = await getPlaceholderImage(image)

  return (
    <Container size={'sm'}>
      <div className="relative m-auto mb-6 flex max-w-4xl flex-col items-center gap-12 text-center md:flex-row md:text-left">
        <Link
          href="/sobre"
          className="animate-fade-in-up animate-delay-100 animate-duration-slow"
        >
          <AuthorAvatar
            src={src}
            alt="foto de Fernando Moreira - front-end e desenvolvedor full-stack"
            placeholder="blur"
            blurDataURL={placeholder}
            size="lg"
          />
        </Link>
        <div className="grid gap-2">
          <h1 className="animate-fade-in-up text-3xl font-extrabold leading-tight animate-delay-200 animate-duration-slow md:text-4xl">
            {title.plain_text}
          </h1>

          <h2 className="block animate-fade-in-up text-xl animate-delay-400 animate-duration-slow md:text-2xl">
            <NotionText richText={page.description.rich_text} />
          </h2>

          <Suspense fallback={<Loader />}>
            <Blocks
              blockId={page.id}
              className="m-0 animate-fade-in-up !p-0 animate-delay-700 animate-duration-slow"
            />
          </Suspense>

          <div className="mt-2 flex animate-fade-in-up flex-col justify-center gap-4 animate-delay-800 animate-duration-slow md:flex-row md:justify-start md:gap-2">
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

            <Button variant={'ghost'} asChild>
              <Link href="/lab" className="w-full xs:w-auto">
                <FlaskConical className="size-4" />
                <span>lab</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
