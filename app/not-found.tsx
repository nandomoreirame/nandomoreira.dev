import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { cn } from '@/lib/utils';
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
        'flex flex-col items-center justify-between h-full md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24 bg-repeat bg-404',
      )}
    >
      <div className="max-w-screen-md m-auto relative text-center">
        <h1
          className={cn(
            'text-8xl text-primary md:text-9xl lg:text-[10rem] font-sans font-black mb-4',
          )}
        >
          404
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl font-medium">
          Oops! A página que vocês acessou não foi encontrada ou não existe.
        </h2>
        <Button variant={'secondary'} asChild>
          <Link href="/">
            <Icon name="ChevronLeft" />
            <span>Voltar para home</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
