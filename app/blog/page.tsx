import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title:
    'Blog do Fernando, indie hacker, desenvolvedor full-stack e web designer',
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
        <h1 className={cn('text-4xl font-sans font-extrabold mb-6')}>
          Olá, eu sou o{' '}
          <span className="text-primary font-semibold">Fernando</span>, indie
          hacker, desenvolvedor full-stack e web designer!
        </h1>
        <Button variant={'outline'} asChild>
          <a href={env.SITE_BASE_URL}>ir para o site</a>
        </Button>
      </div>
    </main>
  );
}
