import { Header } from '@/components/header'
import { env } from '@/env'
import { getDomain } from '@/lib'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'

const title = 'Laboratório do Nando - indie hacker e desenvolvedor full-stack'
const description =
  'Olá, me chamo Fernando Moreira, e nesse blog escrevo sobre programação, AI, front-end, back-end e tecnologias web no geral.'

export const metadata: Metadata = {
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, web, designer, saas, micro-saas, tecnologia, marketing, tech',
  title: {
    template: '%s | Laboratório do Nando',
    default: title,
  },
  description,
  openGraph: {
    title,
    description,
    url: getDomain('blog'),
    siteName: `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
      {env.NODE_ENV === 'production' && env.GA4_LAB_ID && (
        <GoogleAnalytics gaId={env.GA4_LAB_ID} />
      )}
    </>
  )
}
