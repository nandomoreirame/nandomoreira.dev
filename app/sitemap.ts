import { env } from '@/environments';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${env.SITE_BASE_URL}`,
      lastModified: new Date(),
    },
    {
      url: `${env.SITE_BASE_URL}/sobre`,
      lastModified: new Date(),
    },
    {
      url: `${env.SITE_BASE_URL}/contato`,
      lastModified: new Date(),
    },
    {
      url: `${env.BLOG_BASE_URL}`,
      lastModified: new Date(),
    },
    {
      url: `${env.LAB_BASE_URL}`,
      lastModified: new Date(),
    },
  ];
}
