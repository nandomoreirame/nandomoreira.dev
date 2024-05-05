import { env } from '@/environments';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // disallow: '/private/',
    },
    sitemap: `${env.SITE_BASE_URL}/sitemap.xml`,
  };
}
