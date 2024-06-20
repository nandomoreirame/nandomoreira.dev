import { AuthorAvatar } from '@/components/author-avatar'
import { Badge } from '@/components/badge'
import { Blocks } from '@/components/blocks'
import { Container } from '@/components/container'
import { Image } from '@/components/image'
import { Loader } from '@/components/loader'
import { SocialLinks } from '@/components/social-links'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getPlaceholderImage } from '@/lib/sharp'
import { cn, formatDate, getDomain, getFileUrl, metadata } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const post = await notion.getSinglePost({
    database_id: env.BLOG_DATABASE_ID,
    slug: params.slug,
  })

  if (!post) return {}

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
  const post = await notion.getSinglePost({
    database_id: env.BLOG_DATABASE_ID,
    slug: params.slug,
  })

  if (!post) return notFound()

  const [title] = post.title.title
  const [author] = post.author.people
  const category = post.category
  const { date } = post.date

  const cover = post.cover ? getFileUrl(post.cover) : null
  const { src: coverSrc, placeholder: coverPlaceholder } =
    await getPlaceholderImage(cover)

  const image = '/images/fernando-moreira-linhas-amarelas.webp'
  const { src, placeholder } = await getPlaceholderImage(
    author.avatar_url ?? image,
  )

  return (
    <article className={cn('pb-4 pt-8 md:pt-24 lg:pt-32')}>
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
          <h1 className="mb-6 animate-fade-in-up text-2xl font-bold animate-delay-200 animate-duration-slow sm:text-4xl lg:text-5xl">
            {title.plain_text}
          </h1>
          <address className="mt-6 flex animate-fade-in-up flex-col gap-8 not-italic animate-delay-300 animate-duration-slow sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`${getDomain()}/sobre`}>
                <AuthorAvatar
                  src={src}
                  alt="foto de Fernando Moreira - indie hacker e desenvolvedor full-stack"
                  placeholder="blur"
                  blurDataURL={placeholder}
                  size="sm"
                />
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

      {coverSrc && (
        <Container className="blocks animate-fade-in-up animate-delay-500 animate-duration-slow">
          <Image
            src={coverSrc}
            blockId={post.id}
            type="cover"
            placeholder="blur"
            blurDataURL={coverPlaceholder}
            alt={title.plain_text}
          />
        </Container>
      )}

      <Suspense fallback={<Loader />}>
        <Blocks
          size={'lg'}
          blockId={post.id}
          className="animate-fade-in-up animate-delay-700 animate-duration-slow"
        />
      </Suspense>
    </article>
  )
}
