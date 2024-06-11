import { Button, buttonVariants } from '@/components/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { type ComponentProps, type PropsWithChildren } from 'react'

type NavLinkProps = ComponentProps<typeof Link> & {
  active?: boolean
}

export function NavLink({
  href,
  children,
  active = false,
  ...props
}: NavLinkProps) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: 'ghost' }),
        'w-full py-6 md:w-auto md:py-0',
        {
          'dark:text-primary md:bg-gray-800/10 md:dark:bg-gray-100/20': active,
        },
      )}
      href={`${href}`}
      {...props}
    >
      {children}
    </Link>
  )
}

export function Nav({
  children,
  open = false,
  onOpenChange,
}: PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open?: boolean) => void
}>): JSX.Element {
  return (
    <>
      <nav className="ml-auto hidden items-center gap-4 lg:flex">
        {children}
        <ThemeToggle />
      </nav>

      <div className="ml-auto flex gap-4 lg:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button className="lg:hidden" size="icon" variant="ghost">
              <MenuIcon className="size-8" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-auto border-none lg:hidden">
            <nav className="flex w-full flex-col items-center gap-6 pt-12">
              {children}
            </nav>
          </SheetContent>
        </Sheet>
        <ThemeToggle />
      </div>
    </>
  )
}
