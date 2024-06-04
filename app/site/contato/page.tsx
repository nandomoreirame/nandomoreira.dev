import { Button } from '@/components/button'
import { SocialLinks } from '@/components/social-links'
import { cn, getDomain } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contato | Fernando Moreira',
  description: 'Me mande um email e fala pra mim como você tá!',
  openGraph: {
    title: 'Contato | Fernando Moreira',
    description: 'Me mande um email e fala pra mim como você tá!',
    url: `${getDomain()}/contato`,
  },
}

export default function ContactPage() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between px-8 pt-36 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto max-w-screen-xl">
        <h1 className="pt-5 text-4xl font-extrabold md:text-5xl">
          E ai? bão <span className="text-primary">ou não?</span>
        </h1>
        <p className="mb-6 text-xl font-light">
          Mande um email para{' '}
          <a
            className="text-primary/90 underline underline-offset-4 transition duration-150 ease-in-out hover:text-primary/50 focus:text-primary/50"
            href="mailto:oi@nandomoreira.dev?subject=Contato do site&body=Olá Fernando! Vim através do seu site e gostaria de saber mais sobre os seus serviços."
          >
            oi@nandomoreira.dev
          </a>{' '}
          e fala pra mim como você tá!
        </p>
        <div className="block w-full items-center xs:flex md:w-auto">
          <Button
            variant={'outline'}
            className="mb-4 w-full xs:mb-0 xs:w-auto"
            asChild
          >
            <Link href="/">Voltar para home</Link>
          </Button>
          <SocialLinks />
        </div>
      </div>
    </div>
  )
}
