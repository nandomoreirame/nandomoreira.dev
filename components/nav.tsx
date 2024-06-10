'use client'

import { Button, buttonVariants } from '@/components/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/sheet'
import { cn } from '@/lib'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { ThemeToggle } from './theme-toggle'

type NavLinkProps = PropsWithChildren<{
  href: string
  active?: boolean
}>

export function NavLink({ href, children, active = false }: NavLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant: 'ghost' }), 'w-full md:w-auto', {
        'bg-gray-800/10 dark:bg-gray-100/20 dark:text-primary': active,
      })}
      href={`${href}`}
    >
      {children}
    </Link>
  )
}

export function Nav({ children }: PropsWithChildren): JSX.Element {
  return (
    <>
      <nav className="ml-auto hidden items-center gap-4 lg:flex">
        {children}
        <ThemeToggle />
      </nav>

      <div className="ml-auto flex gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="lg:hidden" size="icon" variant="ghost">
              <MenuIcon className="size-8" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-auto border-none lg:hidden">
            <nav className="flex w-full flex-col items-center gap-12">
              {children}
            </nav>
          </SheetContent>
        </Sheet>
        <ThemeToggle />
      </div>
    </>
  )
}
