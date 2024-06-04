import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { LogoIcon } from './logo-icon'
import { ThemeToggle } from './theme-toggle'

type HeaderProps = ComponentProps<'header'>

export function Header({
  children,
  className,
  ...props
}: HeaderProps): JSX.Element {
  return (
    <header
      className={cn('flex md:fixed md:left-0 md:right-0 md:top-0', className)}
      {...props}
    >
      <div className="flex w-full flex-col items-center justify-between gap-2 p-4 text-center md:flex-row md:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-2xl font-bold transition duration-150 hover:text-primary"
        >
          <LogoIcon />
          <span>
            nando
            <strong className="text-primary transition duration-150">
              moreira
            </strong>
          </span>
        </Link>

        <nav className="flex items-center gap-0 md:ml-auto md:gap-2">
          <Link
            className="rounded-md px-2 py-2 font-semibold transition-colors duration-150 hover:bg-gray-100/5 hover:text-primary md:px-4"
            href="/sobre"
          >
            Sobre
          </Link>
          <Link
            className="rounded-md px-2 py-2 font-semibold transition-colors duration-150 hover:bg-gray-100/5 hover:text-primary md:px-4"
            href="/contato"
          >
            Contato
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
