'use client'

import { buttonVariants } from '@/components/button'
import { Container } from '@/components/container'
import { LogoIcon } from '@/components/logo-icon'
import { Nav, NavLink } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn, getDomain, getSubDomain } from '@/lib/utils'
import { FlaskConical, Home, Mail, NotebookText, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ComponentProps, useEffect, useState } from 'react'

type HeaderProps = ComponentProps<'header'>

export function Header({ ...props }: HeaderProps): JSX.Element {
  const [isScrolling, setScrolling] = useState(false)
  const [locationHref, setLocationHref] = useState('')
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

  useEffect(() => {
    setLocationHref(window.location.href)
  }, [currentPath])

  const navItems = [
    {
      label: `Home`,
      href: `${getDomain()}`,
      Icon: Home,
    },
    {
      label: `Sobre`,
      href: `${getDomain()}/sobre`,
      Icon: User,
      active: currentPath === '/sobre',
    },
    {
      label: `Blog`,
      href: `${getDomain('blog')}`,
      Icon: NotebookText,
      active: getSubDomain(locationHref, currentPath) === 'blog',
    },
    {
      label: `Lab`,
      href: `${getDomain('lab')}`,
      Icon: FlaskConical,
      active: getSubDomain(locationHref, currentPath) === 'lab',
    },
  ]

  return (
    <header
      className="z-50 flex md:fixed md:left-0 md:right-0 md:top-2"
      {...props}
    >
      <Container>
        <div
          className={cn(
            'flex w-full flex-col items-center justify-between gap-2 rounded-md bg-gray-300/50 px-4 py-4 md:py-0',
            'text-center backdrop-blur-md transition-all duration-150 dark:bg-gray-900/50 md:flex-row',
            isScrolling ? 'md:h-14' : 'md:h-20',
          )}
        >
          <Link href={getDomain()} className="group flex items-center gap-2">
            <LogoIcon className="transition duration-150 group-hover:rotate-6 group-hover:scale-110 group-hover:text-primary" />
            <span className="text-2xl font-bold transition duration-150 group-hover:text-primary">
              nando
              <span className="text-primary transition duration-150 group-hover:text-foreground">
                moreira
              </span>
            </span>
          </Link>

          <Nav>
            {navItems.map(({ Icon, label, href, active }) => (
              <NavLink key={href} href={href} active={active}>
                <Icon className="size-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            <Link
              href={`${getDomain()}/contato`}
              className={cn(buttonVariants())}
              role="button"
            >
              <Mail className="size-4" />
              <span>Contato</span>
            </Link>

            <ThemeToggle />
          </Nav>
        </div>
      </Container>
    </header>
  )
}
