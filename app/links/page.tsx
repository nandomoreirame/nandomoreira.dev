import { AuthorAvatar } from '@/components/author-avatar'
import { Avatar, AvatarImage } from '@/components/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/card'
import { Container } from '@/components/container'
import { SocialLinks } from '@/components/social-links'
import { NotionText } from '@/components/text'
import { ThemeToggle } from '@/components/theme-toggle'
import { env } from '@/env'
import { notion } from '@/lib/notion'
import { getDomain, metadata, objectToUrlParams } from '@/lib/utils'
import type { FileEmojiBlock } from '@/types/notion'
import Link from 'next/link'

export async function generateMetadata() {
  const { page } = await notion.getPage({
    database_id: env.PAGES_DATABASE_ID,
    slug: 'links',
  })

  const [title] = page.metaTitle.rich_text
  const [description] = page.metaDescription.rich_text
  const [slug] = page.slug.rich_text

  return metadata({
    title: title.plain_text,
    description: description.plain_text,
    baseUrl: getDomain('links'),
    slug: slug.plain_text,
  })
}

type PageParams = {
  params: { domain: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function LinksPage({ searchParams }: PageParams) {
  const _searchParams = objectToUrlParams(searchParams)

  const [{ page }, { links }] = await Promise.all([
    notion.getPage({
      database_id: env.PAGES_DATABASE_ID,
      slug: 'links',
    }),
    notion.getLinks({
      database_id: env.LINKS_DATABASE_ID,
    }),
  ])

  const [title] = page.title.title

  return (
    <>
      <header className="pt-8">
        <Container
          size={'xs'}
          className="flex flex-col items-center justify-center gap-4 text-center"
        >
          <AuthorAvatar size={'lg'} />
          <div>
            <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl">
              {title.plain_text}
            </h1>
          </div>
          <p className="text-lg">
            <NotionText richText={page.description.rich_text} />
          </p>
          <SocialLinks className="justify-center" />
        </Container>
      </header>

      <main>
        <Container size={'xs'}>
          <div className="flex w-full flex-col gap-6 md:gap-8">
            {!links || links.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Nenhum link encontrado
              </p>
            ) : (
              links.map((link) => {
                const [title] = link.title.title
                const [slug] = link.slug.rich_text
                const { description } = link
                const icon = link.image

                let iconUrl = null
                if (icon && icon.type === 'external') {
                  iconUrl = icon.external?.url
                } else if (icon && icon.type === 'file') {
                  iconUrl = icon.file?.url
                }

                let iconEmoji = null
                if (
                  icon &&
                  (icon as unknown as FileEmojiBlock).type === 'emoji'
                ) {
                  iconEmoji = (icon as unknown as FileEmojiBlock).emoji
                }

                return (
                  <Link
                    key={link.id}
                    href={
                      `${slug.plain_text}${_searchParams.length > 0 ? `?${_searchParams}` : ''}` ??
                      '/'
                    }
                    target="_blank"
                  >
                    <Card className="transform bg-white shadow-sm duration-150 ease-in-out hover:-translate-y-2 hover:border-slate-300 hover:shadow-lg dark:bg-slate-800">
                      <CardContent className="flex flex-col items-center justify-center gap-6 p-6 md:flex-row">
                        {icon && iconUrl && (
                          <Avatar className="size-24">
                            <AvatarImage
                              src={`${iconUrl}`}
                              alt={`${title.plain_text}`}
                              className="h-auto w-24 object-cover"
                            />
                          </Avatar>
                        )}
                        {icon && iconEmoji && (
                          <div className="flex size-24 items-center justify-center text-center">
                            <span className="text-6xl">{iconEmoji}</span>
                          </div>
                        )}
                        <div className="grid w-full gap-2 text-center md:text-left">
                          <CardHeader className="m-0 p-0">
                            <CardTitle>{title.plain_text}</CardTitle>
                          </CardHeader>
                          {description && (
                            <CardDescription className="text-muted-foreground">
                              <NotionText richText={description.rich_text} />
                            </CardDescription>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        </Container>
      </main>

      <footer className="py-8">
        <Container
          size={'xs'}
          className="flex flex-col items-center justify-center gap-2 text-center"
        >
          <ThemeToggle />
          <p className="text-sm text-muted-foreground">Feito com ♥️</p>
        </Container>
      </footer>
    </>
  )
}
