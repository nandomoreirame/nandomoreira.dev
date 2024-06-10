'use client'

import { buttonVariants } from '@/components/button'
import { Icon } from '@/components/icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/tooltip'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function SocialLinks() {
  const SocialLinks = [
    // {
    //   name: 'WhatsApp',
    //   url: 'https://wa.me/5541984401163?text=Olá+Fernando!+Vim+através+do+seu+site+e+gostaria+de+saber+mais+sobre+os+seus+serviços.',
    // },
    {
      name: 'Youtube',
      url: 'https://www.youtube.com/@nandomoreiradev',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/nandomoreira.dev/',
    },
    {
      name: 'Linkedin',
      url: 'https://www.linkedin.com/in/nandomoreirame/',
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/oseunando',
    },
    {
      name: 'Github',
      url: 'https://github.com/nandomoreirame',
    },
  ]

  return (
    <div className="inline-flex w-full items-center justify-around gap-2 xs:justify-start">
      <span className="flex-inline text-sm leading-tight text-muted-foreground">
        Minhas redes {'->'}
      </span>{' '}
      {SocialLinks.map((icon) => (
        <TooltipProvider key={icon.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={icon.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'icon' }),
                  'group',
                )}
              >
                <Icon
                  name={icon.name}
                  className="size-5 transition-all duration-150 group-hover:scale-125 group-hover:text-primary xs:size-4"
                />
                <span className="sr-only">
                  Abrir {icon.name} em uma nova janela
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Abrir {icon.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

SocialLinks.displayName = 'SocialLinks'
export { SocialLinks }
