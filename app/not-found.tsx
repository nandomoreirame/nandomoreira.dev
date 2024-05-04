import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `NotFound page`,
  description: `This is a description for NotFound page!`,
};

export default function NotFoundPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-md m-auto relative text-center">
        <h1
          className={cn(
            'text-4xl text-primary md:text-6xl lg:text-8xl font-sans font-extrabold mb-4',
          )}
        >
          404
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl font-medium">
          Oops! A página que vocês acessou não foi encontrada ou não existe.
        </h2>
        <Button variant={'outline'} asChild>
          <Link href="/">Voltar para home</Link>
        </Button>
      </div>
    </div>
  );
}
