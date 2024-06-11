'use client'

import { buttonVariants } from '@/components/button'
import { Container } from '@/components/container'
import { LogoIcon, LogoName } from '@/components/logo'
import { Nav, NavLink } from '@/components/nav'
import { cn, getDomain } from '@/lib/utils'
import { FlaskConical, Home, Mail, NotebookText, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, useEffect, useState } from 'react'

type HeaderProps = ComponentProps<'header'>

export function Header({ ...props }: HeaderProps): JSX.Element {
  const [isScrolling, setScrolling] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const currentPath = usePathname()

  useEffect(() => {
    const toggleScrolling = () => {
      if (window.scrollY > 15) {
        setScrolling(true)
      } else {
        setScrolling(false)
      }
    }

    window.addEventListener('scroll', toggleScrolling)

    return () => {
      window.removeEventListener('scroll', toggleScrolling)
    }
  }, [])

  const navItems = [
    {
      label: 'Home',
      href: '/',
      Icon: Home,
      active: currentPath === '/',
    },
    {
      label: 'Sobre',
      href: '/sobre',
      Icon: User,
      active: currentPath === '/sobre',
    },
    {
      label: `Blog`,
      href: '/blog',
      Icon: NotebookText,
      active:
        currentPath !== '/' &&
        currentPath !== '/sobre' &&
        currentPath !== '/lab' &&
        currentPath !== '/contato',
    },
    {
      label: 'Lab',
      href: '/lab',
      Icon: FlaskConical,
      active: currentPath === '/lab',
    },
  ]

  return (
    <header
      className="mb-8 mt-4 flex md:fixed md:left-0 md:right-0 md:top-2 md:z-50 md:mt-0"
      {...props}
    >
      <Container>
        <div
          className={cn(
            'flex w-full flex-row items-center justify-between gap-2 rounded-md bg-gray-300/50 px-4 py-4 md:py-0',
            'text-center backdrop-blur-md transition-all duration-150 dark:bg-gray-900/50',
            isScrolling ? 'md:h-14' : 'md:h-20',
          )}
        >
          <Link href={getDomain()} className="group flex items-center gap-2">
            <LogoIcon />
            <LogoName className="hidden md:flex" />
          </Link>

          <Nav open={navOpen} onOpenChange={(open) => setNavOpen(!!open)}>
            {navItems.map(({ Icon, label, href, active }) => (
              <NavLink
                key={href}
                href={href}
                active={active}
                onClick={() => setNavOpen(false)}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            <Link
              href={`${getDomain()}/contato`}
              className={cn(buttonVariants(), 'w-full py-8 md:w-auto md:py-0')}
              role="button"
            >
              <Mail className="size-4" />
              <span>Contato</span>
            </Link>
          </Nav>
        </div>
      </Container>
    </header>
  )
}
