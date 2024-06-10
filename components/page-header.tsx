import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'
import { Container } from './container'

export function PageTitle({
  children,
  className,
  ...props
}: ComponentProps<'h1'>): JSX.Element {
  return (
    <h1
      className={cn('mb-4 mt-5 text-3xl font-extrabold md:text-4xl', className)}
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
        'mb-3 block text-lg font-normal text-muted-foreground md:text-xl',
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
    <Container size={'sm'} className={cn('mb-12 pt-32', className)}>
      {children}
    </Container>
  )
}
