import { AboutAvatar } from '@/components/about-avatar'
import { Button } from '@/components/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { env } from '@/environments'
import { cn, getDomain } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Laboratório do Nando',
  openGraph: {
    title: 'Laboratório do Nando, indie hacker, desenvolvedor e web designer',
    url: getDomain('lab'),
    siteName: `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
  },
}

export default function LabPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between px-8 pt-36 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto max-w-screen-xl">
        <AboutAvatar link={`${getDomain()}/sobre`} />
        <h1 className="mb-3 text-xl md:text-2xl lg:text-3xl">
          Laboratório do <span className="text-primary">Nando</span>
        </h1>
        <h2 className="mb-6 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          Olá, eu sou o <span className="text-primary">Fernando</span>, indie
          hacker, desenvolvedor full-stack, marketeiro e web designer!
        </h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <Button asChild>
            <Link href={getDomain()}>ir para o site</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
