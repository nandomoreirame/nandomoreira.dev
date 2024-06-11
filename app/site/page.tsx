import { AuthorAvatar } from '@/components/author-avatar'
import { Button } from '@/components/button'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { cn, getDomain, metadata } from '@/lib/utils'
import {
  ArrowRight,
  FlaskConical,
  Mail,
  NotebookText,
  User,
} from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: '/',
  })

  const [title] = page.metaTitle.rich_text
  const [description] = page.metaDescription.rich_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    slug: '/',
  })
}

export default async function HomePage() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: '/',
  })

  const [title] = page.title.title
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between px-8 pb-16 pt-8 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto flex max-w-4xl flex-col items-center gap-12 md:flex-row">
        <Link href="/sobre">
          <AuthorAvatar size="lg" />
        </Link>
        <div>
          <h1 className="mb-6 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
            Prazer, me chamo <strong className="text-primary">Fernando</strong>
          </h1>
          {page.description && (
            <h2 className="mb-3 block text-xl md:text-2xl">
              {title.plain_text}
            </h2>
          )}
          <p className="mb-4">
            <NotionText richText={page.description.rich_text} />{' '}
            <Link
              href="/sobre"
              className="group inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:no-underline hover:opacity-75"
            >
              <span>Leia mais sobre mim</span>
              <ArrowRight className="size-4 -rotate-45 transform transition-all duration-200 ease-in-out group-hover:rotate-0" />
            </Link>
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button variant={'ghost'} asChild>
              <Link href="/sobre" className="w-full xs:w-auto">
                <User className="size-4" />
                <span>sobre mim</span>
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

            <Button asChild>
              <Link href="/contato" className="w-full xs:w-auto">
                <Mail className="size-4" />
                <span>contato</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
