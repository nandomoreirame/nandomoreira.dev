import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Página não encontrada - Erro 404',
  description:
    'Oops! A página que vocês acessou não foi encontrada ou não existe.',
}

export default function NotFoundPage() {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-between bg-404 bg-right-bottom bg-no-repeat px-8 pt-36 md:min-h-screen md:px-12 md:pt-0 lg:px-24',
      )}
    >
      <div className="relative m-auto max-w-screen-md text-center">
        <h1
          className={cn(
            'mb-4 font-heading text-9xl font-black text-primary md:text-9xl lg:text-[10rem]',
          )}
        >
          404
        </h1>
        <h2 className="mb-6 font-sans text-2xl font-light leading-tight sm:text-3xl md:text-4xl">
          Oops! A página que vocês acessou não foi encontrada ou não existe.
        </h2>
        <Button variant={'secondary'} asChild>
          <Link href="/">
            <Icon name="ChevronLeft" />
            <span>Voltar para home</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
