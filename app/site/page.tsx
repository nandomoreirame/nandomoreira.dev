import { cn } from '@/lib/utils';
import { Button, SocialIcons } from '@components';
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
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl font-bold">
          Olá, eu sou o <span className="text-primary">Fernando.</span>
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
          E eu ajudo empresas a criarem projetos web personalizados, de alta
          qualidade e com tecnologias criativas.
        </h2>
        <div className="block sm:flex w-full md:w-auto items-center">
          <Button
            variant={'outline'}
            className="w-full sm:w-auto mb-4 sm:mb-0"
            asChild
          >
            <Link href="/sobre">Saiba mais sobre mim</Link>
          </Button>
          <SocialIcons />
        </div>
      </div>
    </main>
  );
}
