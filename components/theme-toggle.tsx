'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <>
      <Button
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="rounded-full"
        variant="ghost"
        size="icon"
      >
        <Sun className="hidden h-[1.2rem] w-[1.2rem] dark:flex" />
        <Moon className="flex h-[1.2rem] w-[1.2rem] dark:hidden" />
      </Button>
    </>
  )
}
