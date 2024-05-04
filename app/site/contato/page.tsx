import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Contato page`,
  description: `This is a description for Contato page!`,
};

export default function ContactPage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <h1 className="font-bold pt-5 text-4xl md:text-5xl">
          E ai? bão <span className="text-primary">ou não?</span>
        </h1>
        <p className="text-xl font-light mb-6">
          Mande um email para{' '}
          <a
            className="text-yellow-100 transition duration-150 ease-in-out underline underline-offset-4 hover:text-yellow-500"
            href="mailto:hi@nandomoreira.dev"
          >
            hi@nandomoreira.dev
          </a>{' '}
          e fala pra mim como você tá!
        </p>
        <Button variant={'outline'} asChild>
          <Link href="/">Voltar para home</Link>
        </Button>
      </div>
    </main>
  );
}
