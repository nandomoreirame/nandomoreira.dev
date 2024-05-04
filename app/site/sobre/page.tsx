import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Sobre page`,
  description: `This is a description for Sobre page!`,
};

export default function AboutPage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <h1 className="font-bold pt-5 text-4xl md:text-5xl">sobre mim</h1>
        <p className="text-xl font-light mb-6">
          nem cozinheiro nem rockstar{' '}
          <span className="text-primary font-bold">programador</span>!
        </p>
        <Button variant={'outline'} asChild>
          <Link href="/contato">Entre em contato</Link>
        </Button>
      </div>
    </main>
  );
}
