import { AuthorAvatar } from '@/components/author-avatar'
import { BlogArticle } from '@/components/blog-article'
import { Container } from '@/components/container'
import { SocialLinks } from '@/components/social-links'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain } from '@/lib/utils'
import Link from 'next/link'

export default async function BlogPage() {
  const { posts } = await notion.getPosts({
    database_id: env.BLOG_DATABASE_ID,
  })

  return (
    <div className="blog-list">
      <div className="relative z-1 mx-auto max-w-[880px] px-4 py-6 sm:px-8 sm:py-10 lg:px-0 lg:py-12">
        <div className="lg:gap-15 flex flex-col items-center gap-4 sm:flex-row lg:gap-6">
          <div className="flex h-[277px] w-full max-w-[277px] items-center justify-center rounded-full">
            <Link href={`${getDomain()}/sobre`}>
              <AuthorAvatar size="lg" />
            </Link>
          </div>
          <div className="w-full max-w-[593px]">
            <h1 className="mb-2 text-2xl sm:text-4xl lg:text-3xl xl:text-4xl">
              Blog do{' '}
              <strong className="font-extrabold text-primary">Nando</strong>
            </h1>
            <p className="mb-6 leading-tight text-muted-foreground md:text-lg">
              Olá, me chamo{' '}
              <strong className="font-extrabold text-primary">
                Fernando Moreira
              </strong>
              , e nesse blog escrevo sobre programação, AI, front-end, back-end
              e tecnologias web no geral.
            </p>
            <SocialLinks />
          </div>
        </div>
      </div>

      <Container className="mt-12 flex flex-col gap-y-12 lg:gap-y-24">
        {posts.map((post) => (
          <BlogArticle key={post.id} post={post} />
        ))}
      </Container>
    </div>
  )
}
