import { cn } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Lab page`,
  description: `This is a description for Lab page!`,
};

export default function LabPage() {
  return (
    <div className={cn('flex flex-col p-24')}>
      <h1 className={cn('text-4xl font-sans font-extrabold mb-4')}>
        lab.nandomoreira.dev
      </h1>
    </div>
  );
}
