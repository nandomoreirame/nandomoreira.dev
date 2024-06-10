import { Badge } from '@/components/badge'
import { PageCover } from '@/components/page-cover'
import { cn, getFileUrl } from '@/lib/utils'
import type { Post } from '@/types/blog'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function BlogArticle({ post }: { post: Post }): JSX.Element {
  const [title] = post.title.title
  const [slug] = post.slug.rich_text
  const category = post.category

  return (
    <article className="blog-article">
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

      <div className={cn('w-full', post.cover ? 'max-w-[540px]' : '')}>
        {category.select !== null && (
          <Badge variant={'default'} className="inline-flex">
            {category.select.name}
          </Badge>
        )}
        <h2 className="group mb-2 mt-3 text-xl font-bold text-foreground sm:text-2xl xl:text-3xl">
          <Link
            href={`/${slug.plain_text}`}
            className="hover:underline hover:underline-offset-4 hover:opacity-80"
          >
            {title.plain_text}
          </Link>
        </h2>
        {post.description.rich_text[0]?.plain_text && (
          <p className="font-normal text-muted-foreground">
            {post.description.rich_text[0]?.plain_text}{' '}
            <Link
              href={`/${slug.plain_text}`}
              className="group inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:no-underline hover:opacity-75"
            >
              <span>leia mais</span>
              <ArrowRight className="size-4 -rotate-45 transform transition-all duration-200 ease-in-out group-hover:rotate-0" />
            </Link>
          </p>
        )}
      </div>
    </article>
  )
}
