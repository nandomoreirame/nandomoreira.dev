import '@/styles/blocks.css'
import '@/styles/globals.css'

import { Favicons } from '@/components/favicons'
import { Toaster } from '@/components/sonner'
import { env } from '@/env'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'
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
          {children}
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
