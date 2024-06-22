/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['shiki'],
  },

  transpilePackages: ['lucide-react'],

  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { hostname: '*.amazonaws.com' },
      { hostname: '*.notion.so' },
      { hostname: '*.unsplash.com' },
      { hostname: '*.codepen.io' },
    ],
  },

  async redirects() {
    return [
      { source: '/about', destination: '/sobre', permanent: true },
      { source: '/site', destination: '/', permanent: true },
      { source: '/resume', destination: '/sobre', permanent: true },
      { source: '/site/:slug*', destination: '/:slug*', permanent: true },
      { source: '/now', destination: '/', permanent: true },
      { source: '/styleguide', destination: '/', permanent: true },
      { source: '/contact', destination: '/contato', permanent: true },
      { source: '/experiments', destination: '/lab', permanent: true },
      {
        source: '/links',
        destination: 'https://links.nandomoreira.dev',
        permanent: true,
        basePath: false,
      },
      {
        source: '/experiments/:slug*',
        destination: '/lab/:slug*',
        permanent: true,
      },
      {
        source: '/opengraph-image',
        destination: '/page/home/opengraph-image',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
