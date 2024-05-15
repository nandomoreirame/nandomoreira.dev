import { AboutAvatar } from '@/components/about-avatar';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
  description:
    'Ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
};

export default function HomePage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-8 pb-16 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="flex flex-col md:flex-row gap-12 items-center m-auto relative max-w-4xl">
        <AboutAvatar link="/sobre" />
        <div>
          <h1 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-5xl font-extrabold">
            Olá, eu sou o <span className="text-primary">Fernando</span>.
          </h1>
          <h2 className="mb-3 text-xl md:text-3xl">
            Indie Hacker, Desenvolvedor Full-Stack, Marketeiro e Web Designer!
          </h2>
          <p className="mb-4">
            Ajudo empresas a criarem{' '}
            <strong className="text-primary">SaaS</strong> e{' '}
            <strong className="text-primary">Micro-SaaS</strong> personalizados,
            de alta qualidade e com tecnologias criativas.
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button asChild>
              <Link href="/contato" className="w-full xs:w-auto">
                <Icon name="Mail" className="size-4" />
                <span>contato</span>
              </Link>
            </Button>
            <Button variant={'ghost'} asChild>
              <Link
                href={env.LAB_BASE_URL}
                className="w-full xs:w-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="ExternalLink" className="size-4" />
                <span>labs</span>
              </Link>
            </Button>
            <Button variant={'ghost'} asChild>
              <Link
                href={env.BLOG_BASE_URL}
                className="w-full xs:w-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="ExternalLink" className="size-4" />
                <span>blog</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
