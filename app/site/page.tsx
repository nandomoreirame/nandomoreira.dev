import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Olá, eu sou o Fernando.`,
  description: `E eu ajudo empresas a criarem projetos web personalizados, de alta qualidade e com tecnologias criativas.`,
};

export default function HomePage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <h1 className="mb-3 text-xl md:text-2xl font-bold">
          Olá, eu sou o <span className="text-yellow-300">Fernando.</span>
        </h1>
        <h2 className="font-heading leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
          E eu ajudo empresas a criarem projetos web personalizados, de alta
          qualidade e com tecnologias criativas.
        </h2>
        <Button variant={'outline'} asChild>
          <Link href="/contato">Entre em contato</Link>
        </Button>
      </div>
    </main>
  );
}
