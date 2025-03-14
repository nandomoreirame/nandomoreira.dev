import '@/styles/blocks.css'
import '@/styles/globals.css'
import '@/styles/image-zoom.css'

// import { AckeeTracker } from '@/components/ackee-tracker'
import { CookiesConsent } from '@/components/cookies-consent'
import { Favicons } from '@/components/favicons'
import { Toaster } from '@/components/sonner'
import { TopLoader } from '@/components/top-loader'
import { env } from '@/env'
import { cn, getDomain } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Metadata } from 'next'
import { CookiesProvider } from 'next-client-cookies/server'
import { Inter as FontSans } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import { Suspense } from 'react'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontHeading = localFont({
  src: '../styles/fonts/CalSans-SemiBold.woff2',
  variable: '--font-heading',
})

const title = 'Fernando Moreira - front-end e desenvolvedor full-stack'
const description =
  'Olá, me chamo Fernando Moreira, e nesse blog escrevo sobre programação, AI, front-end, back-end e tecnologias web no geral.'

export const metadata: Metadata = {
  metadataBase: new URL(getDomain()),
  title: {
    template: '%s | Fernando Moreira',
    default: title,
  },
  description,
  keywords:
    'desenvolvedor, developer, front-end, back-end, full-stack, web designer, web, designer, saas, micro-saas, tecnologia, marketing, tech',
  openGraph: {
    title,
    description,
    url: getDomain(),
    siteName: env.NEXT_PUBLIC_ROOT_DOMAIN,
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
        {env.NODE_ENV === 'production' && (
          <>
            <Script
              id="umami-analytics"
              src="https://cloud.umami.is/script.js"
              data-website-id="b92cd797-2bb9-4a46-8af1-e2e7262ed489"
              crossOrigin="anonymous"
              defer
            />
          </>
        )}
        {/* {env.NEXT_PUBLIC_ACKEE_ID && env.NEXT_PUBLIC_ACKEE_SERVER && (
          <Suspense>
            <AckeeTracker />
          </Suspense>
        )} */}
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <CookiesProvider>
            <TopLoader />
            <>{children}</>
            {env.NODE_ENV === 'production' && <CookiesConsent />}
          </CookiesProvider>
          <Toaster position="top-center" />
        </ThemeProvider>

        {/* {env.NODE_ENV === 'production' && env.CRISP_WEBSITE_ID && (
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
        )} */}

        {/* {env.NODE_ENV === 'production' && env.GA4_SITE_ID && (
          <GoogleAnalytics gaId={env.GA4_SITE_ID} />
        )} */}
      </body>
    </html>
  )
}
