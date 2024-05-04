import { env } from '@/environments';
import { cn } from '@/lib/utils';
import { Button } from '@components';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Blog page`,
  description: `This is a description for Blog page!`,
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
          blog.nandomoreira.dev
        </h1>
        <Button variant={'outline'} asChild>
          <a href={env.SITE_BASE_URL}>ir para o site</a>
        </Button>
      </div>
    </main>
  );
}
