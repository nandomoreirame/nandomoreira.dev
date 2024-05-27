import { Button } from '@/components/button';
import { SocialLinks } from '@/components/social-links';
import { cn, getDomain } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contato | Fernando Moreira',
  description: 'Me mande um email e fala pra mim como você tá!',
  openGraph: {
    title: 'Contato | Fernando Moreira',
    description: 'Me mande um email e fala pra mim como você tá!',
    url: `${getDomain()}/contato`,
  },
};

export default function ContactPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <h1 className="pt-5 text-4xl md:text-5xl font-extrabold">
          E ai? bão <span className="text-primary">ou não?</span>
        </h1>
        <p className="text-xl font-light mb-6">
          Mande um email para{' '}
          <a
            className="text-primary/90 hover:text-primary/50 focus:text-primary/50 transition duration-150 ease-in-out underline underline-offset-4"
            href="mailto:oi@nandomoreira.dev?subject=Contato do site&body=Olá Fernando! Vim através do seu site e gostaria de saber mais sobre os seus serviços."
          >
            oi@nandomoreira.dev
          </a>{' '}
          e fala pra mim como você tá!
        </p>
        <div className="block xs:flex w-full md:w-auto items-center">
          <Button
            variant={'outline'}
            className="w-full xs:w-auto mb-4 xs:mb-0"
            asChild
          >
            <Link href="/">Voltar para home</Link>
          </Button>
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}
