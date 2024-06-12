import { AuthorAvatar } from '@/components/author-avatar'
import { BlogArticle } from '@/components/blog-article'
import { Container } from '@/components/container'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain } from '@/lib/utils'
import type { Metadata } from 'next'
import Link from 'next/link'

const title = 'Blog do Nando - indie hacker e desenvolvedor full-stack'
const description =
  'Olá, me chamo Fernando Moreira, e nesse blog escrevo sobre programação, AI, front-end, back-end e tecnologias web no geral.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${getDomain()}/blog`,
  },
}

export default async function BlogPage() {
  const [{ page }, { posts }] = await Promise.all([
    notion.getPage({
      database_id: env.PAGES_DATABASE_ID,
      slug: 'blog',
    }),
    notion.getPosts({
      database_id: env.BLOG_DATABASE_ID,
    }),
  ])

  const [title] = page.title.title

  return (
    <>
      <Container size={'sm'}>
        <div className="lg:gap-15 flex flex-col items-center gap-4 sm:flex-row lg:gap-6">
          <div className="flex h-[277px] w-full max-w-[277px] items-center justify-center rounded-full">
            <Link
              href={`${getDomain()}/sobre`}
              className="animate-fade-in-up animate-delay-100 animate-duration-slow"
            >
              <AuthorAvatar size="lg" />
            </Link>
          </div>
          <div className="flex w-full flex-col gap-4 text-center md:max-w-[593px] md:text-left">
            <h1 className="animate-fade-in-up text-2xl animate-delay-200 animate-duration-slow sm:text-4xl lg:text-3xl xl:text-4xl">
              {title.plain_text}
            </h1>
            <p className="animate-fade-in-up leading-tight text-muted-foreground animate-delay-300 animate-duration-slow md:text-lg">
              <NotionText richText={page.description.rich_text} />
            </p>

            <SocialLinks className="animate-fade-in-up justify-center animate-delay-500 animate-duration-slow md:justify-start">
              <span className="hidden text-sm leading-tight text-muted-foreground md:inline-flex">
                Minhas redes {'->'}
              </span>
            </SocialLinks>
          </div>
        </div>
      </Container>

      <Container className="flex animate-fade-in-up flex-col gap-y-12 py-20 animate-delay-700 animate-duration-slow lg:gap-y-24">
        {posts.map((post, index) => (
          <BlogArticle key={post.id} post={post} mod={index % 2} />
        ))}
      </Container>
    </>
  )
}
