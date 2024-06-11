import '@/styles/blog.css'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Newsletter } from '@/components/newsletter'
import { env } from '@/env'
import { getDomain } from '@/lib/utils'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'

const title = 'Blog do Nando - indie hacker e desenvolvedor full-stack'
const description =
  'Olá, me chamo Fernando Moreira, e nesse blog escrevo sobre programação, AI, front-end, back-end e tecnologias web no geral.'

export const metadata: Metadata = {
  metadataBase: new URL(getDomain('blog')),
  title: {
    template: '%s | Blog do Nando',
    default: title,
  },
  description,
  openGraph: {
    title,
    description,
    url: getDomain('blog'),
    siteName: `blog.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
  },
}

export default function BlogLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
      <Newsletter />
      <Footer />
      {env.NODE_ENV === 'production' && env.GA4_BLOG_ID && (
        <GoogleAnalytics gaId={env.GA4_BLOG_ID} />
      )}
    </>
  )
}
