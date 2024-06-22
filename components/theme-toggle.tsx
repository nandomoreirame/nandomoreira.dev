'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/tooltip'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() =>
              setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
            }
            variant="ghost"
            size="icon"
            className="group bg-background text-foreground"
          >
            <Sun className="hidden h-[1.2rem] w-[1.2rem] transform transition-all duration-500 ease-in-out group-hover:rotate-90 dark:flex" />
            <Moon className="flex h-[1.2rem] w-[1.2rem] transform transition-all duration-500 ease-in-out group-hover:rotate-90 dark:hidden" />
            <span className="sr-only">
              Mudar para o tema {resolvedTheme === 'light' ? 'dark' : 'light'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Mudar para o tema {resolvedTheme === 'light' ? 'dark' : 'light'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
