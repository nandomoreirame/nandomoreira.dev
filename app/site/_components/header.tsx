import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ComponentProps } from 'react';

type HeaderProps = ComponentProps<'header'>;

export function Header({
  children,
  className,
  ...props
}: HeaderProps): JSX.Element {
  return (
    <header
      className={cn('flex md:fixed md:top-0 md:left-0 md:right-0', className)}
      {...props}
    >
      <div className="w-full gap-2 flex flex-col md:flex-row text-center items-center justify-between p-4 md:px-8">
        <Link
          href="/"
          className="text-2xl font-bold group hover:text-primary transition-colors duration-150"
        >
          nando
          <strong className="text-primary group-hover:text-white transition-colors duration-150">
            moreira
          </strong>
        </Link>

        <nav className="md:ml-auto flex items-center gap-0 md:gap-2">
          <Link
            className="font-semibold hover:text-primary transition-colors duration-150 py-2 px-2 md:px-4 rounded-md hover:bg-gray-100/5"
            href="/sobre"
          >
            Sobre
          </Link>
          <Link
            className="font-semibold hover:text-primary transition-colors duration-150 py-2 px-2 md:px-4 rounded-md hover:bg-gray-100/5"
            href="/contato"
          >
            Contato
          </Link>
        </nav>
      </div>
    </header>
  );
}
