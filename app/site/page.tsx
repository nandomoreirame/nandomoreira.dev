import { AboutAvatar } from '@/components/about-avatar'
import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { cn, getDomain } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Fernando Moreira, indie hacker, desenvolvedor e web designer',
  description:
    'Ajudo empresas a criarem SaaS e Micro-SaaS personalizados, de alta qualidade e com tecnologias criativas.',
}

export default function HomePage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between px-8 pb-16 pt-8 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto flex max-w-4xl flex-col items-center gap-12 md:flex-row">
        <AboutAvatar link="/sobre" />
        <div>
          <h1 className="mb-6 text-2xl font-extrabold leading-tight sm:text-3xl md:text-5xl">
            Olá, eu sou o <span className="text-primary">Fernando</span>.
          </h1>
          <h2 className="mb-3 text-xl md:text-3xl">
            Indie Hacker, Desenvolvedor Full-Stack, Marketeiro e Web Designer!
          </h2>
          <p className="mb-4">
            Ajudo empresas a criarem{' '}
            <strong className="text-primary">SaaS</strong> e{' '}
            <strong className="text-primary">Micro-SaaS</strong> personalizados,
            de alta qualidade e com tecnologias criativas.
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button asChild>
              <Link href="/contato" className="w-full xs:w-auto">
                <Icon name="Mail" className="size-4" />
                <span>contato</span>
              </Link>
            </Button>
            <Button variant={'ghost'} asChild>
              <Link href={getDomain('lab')} className="w-full xs:w-auto">
                <Icon name="FlaskConical" className="size-4" />
                <span>labs</span>
              </Link>
            </Button>
            <Button variant={'ghost'} asChild>
              <Link href={getDomain('blog')} className="w-full xs:w-auto">
                <Icon name="NotebookText" className="size-4" />
                <span>blog</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
