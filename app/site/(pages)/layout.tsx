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
      {children}
      <Newsletter />
      <Footer />
    </>
  )
}
