import { Container } from '@/components/container'
import { ScrollToTop } from '@/components/scroll-to-top'
import { SocialLinks } from '@/components/social-links'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

type FooterProps = ComponentProps<'footer'> & {
  scroll?: boolean
}

export const Footer = ({ className, scroll = false }: FooterProps) => {
  return (
    <footer className={cn('blog-footer py-6', className)}>
      <Container className="flex flex-col-reverse flex-wrap items-center justify-center gap-4 lg:flex-row lg:justify-between lg:gap-0 lg:px-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Feito com ♥️</p>
        </div>
        <div className="flex items-center gap-4">
          <SocialLinks />
          {scroll && <ScrollToTop />}
        </div>
      </Container>
    </footer>
  )
}
