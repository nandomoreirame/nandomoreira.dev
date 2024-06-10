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
      name: 'Github',
      url: 'https://github.com/nandomoreirame',
    },
    {
      name: 'Linkedin',
      url: 'https://www.linkedin.com/in/nandomoreirame/',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/oseunando/',
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com/oseunando',
    },
  ]

  return (
    <div className="inline-flex w-full items-center justify-around gap-2 xs:justify-start">
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
                <span className="sr-only">{icon.name}</span>
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
