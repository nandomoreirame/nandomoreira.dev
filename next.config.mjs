import { oldPagesRedirects } from './redirects'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['shiki'],
  },

  transpilePackages: ['lucide-react'],

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'codepen.io',
      },
    ],
  },

  async redirects() {
    return oldPagesRedirects
  },
}

export default nextConfig
