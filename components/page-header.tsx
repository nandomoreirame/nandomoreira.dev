import { Container } from '@/components/container'
import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

export function PageTitle({
  children,
  className,
  ...props
}: ComponentProps<'h1'>): JSX.Element {
  return (
    <h1
      className={cn(
        'mb-4 mt-5 animate-fade-in-up text-3xl font-extrabold animate-delay-100 animate-duration-slow md:text-4xl',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

export function PageDescription({
  children,
  className,
  ...props
}: ComponentProps<'h2'>): JSX.Element {
  return (
    <p
      className={cn(
        'mb-3 block animate-fade-in-up text-lg font-normal text-muted-foreground animate-delay-200 animate-duration-slow md:text-xl',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function PageHeader({
  children,
  className,
}: ComponentProps<'div'>): JSX.Element {
  return (
    <Container size={'sm'} className={cn('mb-8', className)}>
      {children}
    </Container>
  )
}
