import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { AboutAvatar, Button, Icon, SocialIcons } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title:
    'Olá, eu sou o Fernando, indie hacker, desenvolvedor full-stack e web designer!',
  description:
    'Eu ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
  openGraph: {
    title:
      'Olá, eu sou o Fernando, indie hacker, desenvolvedor full-stack e web designer!',
    description:
      'Eu ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
    url: env.SITE_BASE_URL,
    siteName: 'nandomoreira.dev',
    images: [
      {
        url: `${env.SITE_BASE_URL}/images/share.jpg`,
        width: 1200,
        height: 675,
        alt: 'Olá, eu sou o Fernando, indie hacker, desenvolvedor full-stack e web designer',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <AboutAvatar link="/sobre" />
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl">
          Olá, eu sou o{' '}
          <span className="text-primary font-semibold">Fernando</span>, indie
          hacker, desenvolvedor full-stack e web designer!
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
          E eu ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de
          alta qualidade e com tecnologias criativas.
        </h2>
        <div className="block xs:flex w-full md:w-auto items-center">
          <Button
            variant={'outline'}
            className="w-full xs:w-auto mb-4 xs:mb-0"
            asChild
          >
            <Link href="/contato">
              <Icon name="Mail" className="size-4" />
              contato
            </Link>
          </Button>
          <SocialIcons />
        </div>
      </div>
    </div>
  );
}
