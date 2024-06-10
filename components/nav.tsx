'use client'

import { buttonVariants } from '@/components/button'
import { cn } from '@/lib'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'

type NavLinkProps = PropsWithChildren<{
  href: string
  active?: boolean
}>

export function NavLink({ href, children, active = false }: NavLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant: 'ghost' }), {
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
    <nav className="flex items-center gap-0 md:ml-auto md:gap-2">
      {children}
    </nav>
  )
}
