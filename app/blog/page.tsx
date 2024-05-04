import { cn } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Blog page`,
  description: `This is a description for Blog page!`,
};

export default function BlogPage() {
  return (
    <div className={cn('flex flex-col p-24')}>
      <h1 className={cn('text-4xl font-sans font-extrabold mb-4')}>
        blog.nandomoreira.dev
      </h1>
    </div>
  );
}
