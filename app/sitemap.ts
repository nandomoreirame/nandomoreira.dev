import { getDomain } from '@/lib'
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
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
      url: `${getDomain('blog')}`,
      lastModified: new Date(),
    },
    {
      url: `${getDomain('lab')}`,
      lastModified: new Date(),
    },
  ]
}
