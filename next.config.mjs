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
      { hostname: 'images.unsplash.com' },
      { hostname: 'codepen.io' },
    ],
  },
}

export default nextConfig
