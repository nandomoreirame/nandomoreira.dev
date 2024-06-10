'use client'

import { Button } from '@/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/tooltip'
import { ChevronUp } from 'lucide-react'

export const ScrollToTop = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size={'icon'} variant={'outline'} onClick={scrollToTop}>
            <ChevronUp className="size-6" />
            <span className="sr-only">Ir para o topo</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ir para o topo</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
