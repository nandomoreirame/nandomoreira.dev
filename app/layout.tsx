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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn('scroll-smooth antialiased size-full', fontSans.variable)}
    >
      <body
        className={cn(
          'vsc-initialized size-full',
          'bg-zinc-900 text-zinc-100',
          'selection:bg-primary selection:text-primary-foreground',
        )}
      >
        <>{children}</>
      </body>
    </html>
  );
}
