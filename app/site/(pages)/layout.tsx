import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Newsletter } from '@/components/newsletter'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <main className="pb-4 pt-8 md:pb-8 md:pt-24 lg:pb-12 lg:pt-32">
        {children}
      </main>
      <Newsletter />
      <Footer scroll />
    </>
  )
}
