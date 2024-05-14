import { CustomCursor } from '@/components/custom-cursor';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Fernando Moreira',
    default: 'Fernando Moreira',
  },
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, saas, micro-saas, tecnologia, tech',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className={cn('dark', fontSans.variable)}>
      <body>
        <CustomCursor />
        <>{children}</>
      </body>
    </html>
  );
}
