/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['shiki'],
    // serverComponentsExternalPackages: ['shiki'],
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
    return [
      {
        source: '/about',
        destination: '/sobre',
        permanent: true,
      },
      {
        source: '/contact',
        destination: '/contato',
        permanent: true,
      },
      {
        source: '/blog',
        destination: 'https://blog.nandomoreira.dev',
        permanent: true,
      },
      {
        source: '/lab',
        destination: 'https://lab.nandomoreira.dev',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
