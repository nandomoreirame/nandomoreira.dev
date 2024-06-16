import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export function Newsletter(): JSX.Element {
  return (
    <section className="my-12 mt-12 w-full px-4 md:px-0">
      <Container
        size={'sm'}
        className="relative animate-fade-in-up bg-gray-300/50 py-12 pb-12 text-center animate-delay-800 animate-duration-slow dark:bg-gray-900/50 md:rounded-lg"
      >
        <div className="m-auto max-w-2xl px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-1 -mt-72 sm:-mt-32 md:mt-0"
          >
            <svg
              className="absolute inset-0 size-full"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 1463 360"
            >
              <path
                className="text-gray-500 text-opacity-10"
                fill="currentcolor"
                d="M-82.673 72l1761.849 472.086-134.327 501.315-1761.85-472.086z"
              />
              <path
                className="text-gray-500 text-opacity-10"
                fill="currentcolor"
                d="M-217.088 544.086 1544.761 72l134.327 501.316-1761.849 472.086z"
              />
            </svg>
          </div>
          <div className="relative z-5 flex flex-col items-center justify-center gap-3">
            <h3 className="text-3xl font-semibold uppercase text-foreground">
              Newsletter
            </h3>

            <p className="text-lg">
              Cadastre-se para receber notificações de lançamento de novos
              produtos ou novos artigos.
            </p>

            <Button className="h-12 w-full md:max-w-40" asChild>
              <Link
                href="https://nandomoreira.substack.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="size-4" />
                <span>Inscrever</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
