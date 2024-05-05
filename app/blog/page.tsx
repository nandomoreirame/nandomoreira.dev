import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { AboutAvatar, Button } from '@components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog do Nando, indie hacker, desenvolvedor full-stack e web designer',
  description:
    'Eu ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
};

export default function BlogPage() {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-between md:min-h-screen pt-36 px-8 md:pt-0 md:px-12 lg:px-24',
      )}
    >
      <div className="max-w-screen-xl m-auto relative">
        <AboutAvatar link={`${env.SITE_BASE_URL}/sobre`} />
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl font-display">
          Blog do <span className="text-primary font-semibold">Nando</span>
        </h1>
        <h2 className="leading-tight mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-display">
          Olá, eu sou o{' '}
          <span className="text-primary font-semibold">Fernando</span>, indie
          hacker, desenvolvedor full-stack e web designer!
        </h2>
        <Button variant={'outline'} asChild>
          <a href={env.SITE_BASE_URL}>Ir para o site</a>
        </Button>
      </div>
    </main>
  );
}
