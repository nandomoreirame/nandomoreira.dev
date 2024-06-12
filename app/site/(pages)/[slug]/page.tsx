import { AuthorAvatar } from '@/components/author-avatar'
import { Badge } from '@/components/badge'
import { Container } from '@/components/container'
import { PageCover } from '@/components/page-cover'
import { RenderBlock } from '@/components/render-block'
import { SocialLinks } from '@/components/social-links'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { formatDate, getDomain, getFileUrl, metadata } from '@/lib/utils'
import type { Block } from '@/types/notion'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const result = await notion.getPost({
    database_id: env.BLOG_DATABASE_ID,
    slug: decodeURIComponent(params.slug),
  })

  if (!result) return notFound()

  const { post } = result
  const [title] = post.title.title
  const [description] = post.description.rich_text
  const [author] = post.author.people
  const [slug] = post.slug.rich_text
  const { date } = post.date

  return metadata({
    title: title.plain_text,
    slug: slug.plain_text,
    description: description.plain_text,
    baseUrl: getDomain(),
    article: {
      authors: [author.name as string],
      section: post.category.select?.name ?? '',
      publishedTime: date.start,
    },
  })
}

export default async function SinglePage({
  params,
}: {
  params: { slug: string }
}) {
  const result = await notion.getPost({
    database_id: env.BLOG_DATABASE_ID,
    slug: decodeURIComponent(params.slug),
  })

  if (!result) return notFound()

  const { post, blocks } = result
  const [title] = post.title.title
  const [author] = post.author.people
  const category = post.category
  const { date } = post.date

  return (
    <article className="blog-single">
      <Container>
        <header className="mb-6 py-4">
          <Container size={'sm'}>
            {category.select !== null && (
              <Badge
                variant={'default'}
                className="mb-4 inline-flex animate-fade-in-up animate-delay-100 animate-duration-slow"
              >
                {category.select.name}
              </Badge>
            )}
            <h1 className="blog-single-title animate-fade-in-up animate-delay-200 animate-duration-slow">
              {title.plain_text}
            </h1>
            <address className="mt-6 flex animate-fade-in-up flex-col gap-8 not-italic animate-delay-300 animate-duration-slow sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <Link href={`${getDomain()}/sobre`}>
                  <AuthorAvatar size="sm" src={author.avatar_url ?? ''} />
                </Link>
                <div>
                  <h4 className="text-xl font-semibold">
                    <Link href={`${getDomain()}/sobre`} rel="author">
                      {author.name}
                    </Link>
                  </h4>
                  <div className="grid">
                    <span>Dev FullStack & Indie Hacker</span>
                    <time dateTime={date.start} title={formatDate(date.start)}>
                      {formatDate(date.start)}
                    </time>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SocialLinks>
                  <span className="hidden text-sm leading-tight text-muted-foreground md:inline-flex">
                    Minhas redes {'->'}
                  </span>
                </SocialLinks>
              </div>
            </address>
          </Container>
        </header>

        <div className="blocks animate-fade-in-up animate-delay-500 animate-duration-slow">
          {post.cover && (
            <PageCover
              src={`${getFileUrl(post.cover)}`}
              pageId={post.id}
              alt={title.plain_text}
              width={1000}
              height={600}
            />
          )}

          <div className="blog-single-content">
            {blocks.map((b) => {
              const block = b as unknown as Block
              return <RenderBlock key={`block-${block.id}`} block={block} />
            })}
          </div>
        </div>
      </Container>
    </article>
  )
}
