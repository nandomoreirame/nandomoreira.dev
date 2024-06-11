import '@/styles/blocks.css'
import '@/styles/globals.css'

import { BookiesConsent } from '@/components/bookies-consent'
import { Favicons } from '@/components/favicons'
import { Toaster } from '@/components/sonner'
import { env } from '@/env'
import { cn, getDomain } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Metadata } from 'next'
import { CookiesProvider } from 'next-client-cookies/server'
import { Inter as FontSans } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontHeading = localFont({
  src: '../styles/fonts/CalSans-SemiBold.woff2',
  variable: '--font-heading',
})

const title = 'Fernando Moreira - indie hacker e desenvolvedor full-stack'
const description =
  'Olá, me chamo Fernando Moreira, e nesse blog escrevo sobre programação, AI, front-end, back-end e tecnologias web no geral.'

export const metadata: Metadata = {
  title: {
    template: '%s | Fernando Moreira',
    default: title,
  },
  description,
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, web, designer, saas, micro-saas, tecnologia, marketing, tech',
  openGraph: {
    title,
    description,
    url: getDomain(),
    siteName: 'nandomoreira.dev',
    locale: 'pt_BR',
    type: 'website',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-br"
      className={cn('dark', fontSans.variable, fontHeading.variable)}
      suppressHydrationWarning
    >
      <head>
        <Favicons />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <CookiesProvider>
            {children}
            <BookiesConsent />
          </CookiesProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>

        {env.NODE_ENV === 'production' && env.CRISP_WEBSITE_ID && (
          <Script
            id="crisp-chat"
            dangerouslySetInnerHTML={{
              __html: `
                window.$crisp=[];
                window.CRISP_WEBSITE_ID="${env.CRISP_WEBSITE_ID}";
                (function(){
                  d=document;s=d.createElement("script");
                  s.src="https://client.crisp.chat/l.js";
                  s.async=1;d.getElementsByTagName("head")[0].appendChild(s);
                })();
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
