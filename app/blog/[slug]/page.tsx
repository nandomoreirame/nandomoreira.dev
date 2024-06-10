import { AuthorAvatar } from '@/components/author-avatar'
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

  return metadata({
    title: title.plain_text,
    slug: slug.plain_text,
    description: description.plain_text,
    baseUrl: getDomain('blog'),
    article: {
      authors: [author.name as string],
      section: post.category.select?.name ?? '',
      publishedTime: post.createdAt,
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

  return (
    <article className="blog-single">
      <Container>
        <header className="mb-6 py-4">
          <Container size={'sm'}>
            <h1 className="blog-single-title">{title.plain_text}</h1>
            <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <Link href={`${getDomain()}/sobre`}>
                  <AuthorAvatar size="sm" src={author.avatar_url ?? ''} />
                </Link>
                <div>
                  <h4 className="text-xl font-semibold">
                    <Link href={`${getDomain()}/sobre`}>{author.name}</Link>
                  </h4>
                  <div className="flex gap-2 align-bottom">
                    <div className="flex items-center gap-2">
                      <span className="italic">
                        {post.category.select?.name && (
                          <span>categoria: {post.category.select?.name}</span>
                        )}
                        <span> ⏤ em: {formatDate(post.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SocialLinks />
              </div>
            </div>
          </Container>
        </header>

        <div className="blocks">
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
