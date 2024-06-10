import { Container } from '@/components/container'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SocialLinks } from '@/components/social-links'

export const Footer = () => {
  return (
    <footer className="blog-footer py-6">
      <Container className="flex flex-col flex-wrap items-center justify-center gap-4 lg:flex-row lg:justify-between lg:gap-0 lg:px-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Feito com ♥️</p>
        </div>
        <div className="flex items-center gap-4">
          <SocialLinks />
          <ScrollToTop />
        </div>
      </Container>
    </footer>
  )
}
