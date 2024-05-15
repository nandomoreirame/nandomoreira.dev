import { AboutAvatar } from '@/components/about-avatar';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { SocialLinks } from '@/components/social-links';
import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre | Fernando Moreira',
  description: 'indie hacker, desenvolvedor full-stack e web designer.',
  openGraph: {
    title: 'Sobre | Fernando Moreira',
    description: 'indie hacker, desenvolvedor full-stack e web designer.',
    url: `${env.SITE_BASE_URL}/sobre`,
  },
};

export default function AboutPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-8 pb-16 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <AboutAvatar tooltip="Eu sou o Fernando Moreira, prazer!" />
        <h1 className="pt-5 text-4xl md:text-5xl font-extrabold">Sobre mim</h1>
        <p className="text-xl font-light mb-6">
          <strong className="text-primary">
            indie hacker, desenvolvedor full-stack e web designer.
          </strong>
        </p>
        <div className="block xs:flex w-full md:w-auto items-center">
          <Button className="w-full xs:w-auto mb-4 xs:mb-0" asChild>
            <Link href="/contato">
              <Icon name="Mail" className="size-4" />
              contato
            </Link>
          </Button>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
