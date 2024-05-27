import { AboutAvatar } from '@/components/about-avatar';
import { Button } from '@/components/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { env } from '@/environments';
import { cn, getDomain } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Laboratório do Nando',
  openGraph: {
    title: 'Laboratório do Nando, indie hacker, desenvolvedor e web designer',
    url: getDomain('lab'),
    siteName: `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
  },
};

export default function LabPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <AboutAvatar link={`${getDomain()}/sobre`} />
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl">
          Laboratório do <span className="text-primary">Nando</span>
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
          Olá, eu sou o <span className="text-primary">Fernando</span>, indie
          hacker, desenvolvedor full-stack, marketeiro e web designer!
        </h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <Button asChild>
            <Link href={getDomain()}>ir para o site</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
