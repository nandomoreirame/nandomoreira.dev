import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { ComponentProps } from 'react'

const containerVariants = cva('container', {
  variants: {
    size: {
      default: 'max-w-[1180px]',
      sm: 'max-w-[860px]',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

interface ContainerProps
  extends ComponentProps<'div'>,
    VariantProps<typeof containerVariants> {}

export function Container({
  children,
  className,
  size,
  ...props
}: ContainerProps): JSX.Element {
  return (
    <div className={cn(containerVariants({ size }), className)} {...props}>
      <>{children}</>
    </div>
  )
}
