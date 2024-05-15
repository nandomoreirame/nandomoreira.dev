'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <Button
        onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
        className="rounded-full"
        variant="ghost"
        size="icon"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] hidden dark:flex" />
        <Moon className="h-[1.2rem] w-[1.2rem] flex dark:hidden" />
      </Button>
    </>
  );
}
