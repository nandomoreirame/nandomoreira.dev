import { Badge } from '@/components/badge'
import { getPlaceholderImage } from '@/lib/sharp'
import { cn, formatDate, getFileUrl } from '@/lib/utils'
import type { Post } from '@/types/blog'
import Link from 'next/link'
import { Image } from './image'

export async function BlogArticle({ post, mod }: { post: Post; mod: number }) {
  const [title] = post.title.title
  const [slug] = post.slug.rich_text
  const category = post.category
  const { date } = post.date

  const cover = post.cover ? getFileUrl(post.cover) : null
  const { src: coverSrc, placeholder: coverPlaceholder } =
    await getPlaceholderImage(cover)

  return (
    <article
      className={cn(
        'flex flex-col items-center gap-10 lg:gap-12',
        mod === 1 ? 'lg:flex-row-reverse lg:text-right' : 'lg:flex-row',
      )}
    >
      {coverSrc && (
        <Link
          href={`/${slug.plain_text}`}
          className="w-full max-w-[570px] animate-fade-in-up overflow-hidden rounded-lg animate-delay-1000 animate-duration-slow"
        >
          <Image
            src={coverSrc}
            alt={title.plain_text}
            blockId={post.id}
            type="cover"
            placeholder="blur"
            blurDataURL={coverPlaceholder}
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
