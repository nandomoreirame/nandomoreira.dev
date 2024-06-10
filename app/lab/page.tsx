import { AuthorAvatar } from '@/components/author-avatar'
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { SocialLinks } from '@/components/social-links'
import { env } from '@/env'
import { cn, getDomain } from '@/lib/utils'
import { Mail, NotebookText } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Laboratório do Nando',
  openGraph: {
    title: 'Laboratório do Nando - indie hacker e desenvolvedor full-stack',
    url: getDomain('lab'),
    siteName: `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
  },
}

export default function LabPage() {
  return (
    <div
      className={cn(
        'flex h-screen items-center justify-between px-8 pt-36 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <Container size={'sm'}>
        <div className="grid gap-4">
          <AuthorAvatar size="md" className="mb-5" />
          <div>
            <Badge variant={'outline'}>Em breve!</Badge>
            <h2 className="mt-2 text-xl md:text-2xl">
              Laboratório do <span className="text-primary">Nando</span>
            </h2>
          </div>

          <h1 className="mb-6 text-2xl font-extrabold leading-tight sm:text-3xl">
            Olá, eu sou o <span className="text-primary">Fernando</span>, indie
            hacker e desenvolvedor full-stack, aqui vou adicionar todos os meus
            experimentos e produtos que já desenvolvi.
          </h1>

          <div className="flex flex-col gap-2 md:flex-row">
            <Button asChild>
              <Link
                href={`${getDomain()}/contato`}
                className="w-full xs:w-auto"
              >
                <Mail className="size-4" />
                <span>contato</span>
              </Link>
            </Button>

            <Button variant={'ghost'} asChild>
              <Link href={getDomain('blog')} className="w-full xs:w-auto">
                <NotebookText className="size-4" />
                <span>blog</span>
              </Link>
            </Button>

            <div className="xs:px-4">
              <SocialLinks />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
