import { env } from '@/env'
import { getDomain } from '@/lib'
import { notion } from '@/lib/notion'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
      url: `${getDomain('links')}`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain('lab')}`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain('blog')}`,
      lastModified: new Date(),
    },
    ...posts.map(({ slug, updatedAt }) => {
      const [s] = slug.rich_text
      return {
        url: `${getDomain('blog')}/${s.plain_text}`,
        lastModified: new Date(updatedAt),
      }
    }),
  ]
}
