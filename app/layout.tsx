import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Montserrat as FontDisplay, Inter as FontSans } from 'next/font/google';
import './globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontDisplay = FontDisplay({
  subsets: ['latin'],
  variable: '--font-display',
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
      className={cn('dark', fontSans.variable, fontDisplay.variable)}
    >
      <body>
        <>{children}</>
      </body>
    </html>
  );
}
