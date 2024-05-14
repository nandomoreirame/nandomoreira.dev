/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lucide-react'],
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
    ];
  },
};

export default nextConfig;
