import { Footer } from '@/components/footer'
import { ThemeToggle } from '@/components/theme-toggle'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <div className="absolute right-2 top-2 z-99">
        <ThemeToggle />
      </div>

      <main className="flex min-h-full w-full flex-col items-center justify-center py-12 md:h-screen">
        {children}
      </main>

      <Footer className="mt-4 animate-fade-in-up px-8 animate-delay-700 animate-duration-slow md:fixed md:bottom-0 md:left-0 md:right-0 md:z-99 md:mt-0" />
    </>
  )
}
