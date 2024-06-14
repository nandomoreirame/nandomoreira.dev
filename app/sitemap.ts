import { env } from '@/env'
import { getDomain } from '@/lib'
import { notion } from '@/lib/notion'
import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = headers()
  const subdomain = headerList
    .get('host')!
    .replace(`${env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
    .replace('.', '')

  if (subdomain === 'links') {
    return [
      {
        url: `${getDomain(subdomain)}`,
        lastModified: new Date(),
      },
    ]
  }

  const { posts } = await notion.getPosts({
    database_id: env.BLOG_DATABASE_ID,
  })

  return [
    {
      url: `${getDomain()}`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain()}/sobre`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain()}/contato`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain()}/lab`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain()}/blog`,
      lastModified: new Date(),
    },
    ...posts.map(({ slug, updatedAt }) => {
      const [s] = slug.rich_text
      return {
        url: `${getDomain()}/${s.plain_text}`,
        lastModified: new Date(updatedAt),
      }
    }),
  ]
}
