import { Badge } from '@/components/badge'
import { Blocks } from '@/components/blocks'
import { Image } from '@/components/image'
import { Loader } from '@/components/loader'
import {
  PageDescription,
  PageHeader,
  PageTitle,
} from '@/components/page-header'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { cn, getFileUrl } from '@/lib/utils'
import { ComponentProps, Suspense } from 'react'
import { Container } from './container'

type PageProps = ComponentProps<'div'> & {
  slug: string
  pageTitle?: string | JSX.Element
  pageDescription?: string | JSX.Element
  pageBadge?: string | JSX.Element
}

export async function Page({
  slug,
  children,
  className,
  pageTitle,
  pageDescription,
  pageBadge,
  ...props
}: PageProps) {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug,
  })

  const [title] = page.title.title
  const description = page.description

  return (
    <main
      className={cn('pb-4 pt-8 md:pb-8 md:pt-24 lg:pb-12 lg:pt-32', className)}
      {...props}
    >
      <PageHeader>
        {pageBadge && <Badge variant={'outline'}>{pageBadge}</Badge>}
        <PageTitle>{pageTitle ?? title.plain_text}</PageTitle>
        {pageDescription && (
          <PageDescription>{pageDescription}</PageDescription>
        )}
        {!pageDescription && description && (
          <PageDescription>
            <NotionText richText={description?.rich_text} />
          </PageDescription>
        )}
        <SocialLinks className="animate-fade-in-up animate-delay-400 animate-duration-slow" />
      </PageHeader>

      {page.cover && (
        <Image
          src={`${getFileUrl(page.cover)}`}
          blockId={page.id}
          type="cover"
          alt={title.plain_text}
          width={1000}
          height={600}
          className="animate-fade-in-up animate-delay-500 animate-duration-slow"
        />
      )}

      {children}

      <Container size={'sm'}>
        <Suspense fallback={<Loader />}>
          <Blocks
            blockId={page.id}
            className="animate-fade-in-up p-0 animate-delay-700 animate-duration-slow"
          />
        </Suspense>
      </Container>
    </main>
  )
}
