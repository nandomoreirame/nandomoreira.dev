import { AboutAvatar } from '@/components/about-avatar'
import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { SocialLinks } from '@/components/social-links'
import { cn, getDomain } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sobre | Fernando Moreira',
  description: 'indie hacker, desenvolvedor full-stack e web designer.',
  openGraph: {
    title: 'Sobre | Fernando Moreira',
    description: 'indie hacker, desenvolvedor full-stack e web designer.',
    url: `${getDomain()}/sobre`,
  },
}

export default function AboutPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between px-8 pb-16 pt-8 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto max-w-screen-xl">
        <AboutAvatar tooltip="Eu sou o Fernando Moreira, prazer!" />
        <h1 className="pt-5 text-4xl font-extrabold md:text-5xl">Sobre mim</h1>
        <p className="mb-6 text-xl font-light">
          <strong className="text-primary">
            indie hacker, desenvolvedor full-stack e web designer.
          </strong>
        </p>
        <div className="block w-full items-center xs:flex md:w-auto">
          <Button className="mb-4 w-full xs:mb-0 xs:w-auto" asChild>
            <Link href="/contato">
              <Icon name="Mail" className="size-4" />
              contato
            </Link>
          </Button>
          <SocialLinks />
        </div>
      </div>
    </div>
  )
}
