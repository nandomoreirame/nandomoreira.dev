import { Badge } from '@/components/badge'
import { PageCover } from '@/components/page-cover'
import { cn, formatDate, getFileUrl } from '@/lib/utils'
import type { Post } from '@/types/blog'
import Link from 'next/link'

export function BlogArticle({
  post,
  mod,
}: {
  post: Post
  mod: number
}): JSX.Element {
  const [title] = post.title.title
  const [slug] = post.slug.rich_text
  const [author] = post.author.people
  const category = post.category
  const { date } = post.date

  return (
    <article
      className={cn(
        'flex flex-col items-center gap-10 lg:gap-12',
        mod === 1 ? 'lg:flex-row-reverse lg:text-right' : 'lg:flex-row',
      )}
    >
      {post.cover && (
        <Link
          href={`/${slug.plain_text}`}
          className="w-full max-w-[570px] overflow-hidden rounded-lg"
        >
          <PageCover
            src={`${getFileUrl(post.cover)}`}
            alt={title.plain_text}
            pageId={post.id}
            width={600}
            height={600}
          />
        </Link>
      )}

      <div
        className={cn('grid w-full gap-4', post.cover ? 'max-w-[540px]' : '')}
      >
        <header>
          <h2 className="group text-xl font-bold text-foreground sm:text-2xl xl:text-3xl">
            <Link
              href={`/${slug.plain_text}`}
              className="hover:underline hover:underline-offset-4 hover:opacity-80"
            >
              {title.plain_text}
            </Link>
          </h2>
        </header>

        {post.description.rich_text[0]?.plain_text && (
          <p className="font-normal text-muted-foreground">
            <Link
              href={`/${slug.plain_text}`}
              className="hover:underline hover:underline-offset-4 hover:opacity-75"
            >
              {post.description.rich_text[0]?.plain_text}{' '}
            </Link>
          </p>
        )}

        <footer
          className={cn('flex items-center gap-2', {
            'justify-end': mod === 1,
          })}
        >
          <time
            dateTime={date.start}
            title={formatDate(date.start)}
            className="text-sm text-gray-500 dark:text-gray-500"
          >
            {formatDate(date.start)}
          </time>
          {category.select !== null && (
            <Badge variant={'default'} className="inline-flex">
              {category.select.name}
            </Badge>
          )}
        </footer>
      </div>
    </article>
  )
}
