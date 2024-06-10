'use client'

import { Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'

export function CopyToClipboard({ code }: { code: string }): JSX.Element {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('o código foi copiado para área de transferência!')
    } catch (error) {
      console.error('[ Error copying to clipboard ]', error)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={'ghost'} size={'icon'} onClick={copyToClipboard}>
            <Clipboard className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>copiar para área de transferência</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
