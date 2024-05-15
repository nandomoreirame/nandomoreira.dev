import { CustomCursor } from '@/components/custom-cursor';
import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/providers/theme-provider';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, saas, micro-saas, tecnologia, marketing, tech',
  openGraph: {
    title: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
    description:
      'Ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
    url: env.SITE_BASE_URL,
    siteName: 'nandomoreira.dev',
    images: [
      {
        url: `${env.SITE_BASE_URL}/images/share.jpg`,
        width: 1200,
        height: 675,
        alt: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn('dark', fontSans.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <CustomCursor />
          <>{children}</>
        </ThemeProvider>
      </body>
    </html>
  );
}
