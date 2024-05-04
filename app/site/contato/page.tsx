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
    <main className={cn('p-24')}>
      <h1 className="font-bold pt-5 text-4xl md:text-5xl">
        E ai? bão <span className="text-yellow-300">ou não?</span>
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
    </main>
  );
}
