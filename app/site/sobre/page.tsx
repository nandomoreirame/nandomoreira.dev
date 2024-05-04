import { cn } from '@/lib/utils';
import { Button, Icon, SocialIcons } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre mim',
  description: 'nem cozinheiro nem rockstar programador!',
};

export default function AboutPage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <h1 className="pt-5 text-4xl md:text-5xl font-extrabold font-display">
          sobre mim
        </h1>
        <p className="text-xl font-light mb-6">
          nem cozinheiro nem rockstar{' '}
          <span className="text-primary font-bold">programador</span>!
        </p>
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
    </main>
  );
}
