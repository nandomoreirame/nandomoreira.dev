import { Favicons } from '@/components/favicons'
import { env } from '@/environments'
import { cn, getDomain } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, saas, micro-saas, tecnologia, marketing, tech',
  openGraph: {
    title: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
    description:
      'Ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
    url: getDomain(),
    siteName: 'nandomoreira.dev',
    images: [
      {
        url: `${getDomain()}/images/share.jpg`,
        width: 1200,
        height: 675,
        alt: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-br"
      className={cn('dark', fontSans.variable)}
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
          <>{children}</>
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
