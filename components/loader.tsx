import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { ComponentProps } from 'react'

const loaderVariants = cva('inline-flex', {
  variants: {
    size: {
      sm: 'size-6',
      default: 'size-8',
      md: 'size-10',
      lg: 'size-12',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

type LoaderProps = ComponentProps<'span'> & VariantProps<typeof loaderVariants>

export function Loader({
  children,
  className,
  size,
  ...props
}: LoaderProps): JSX.Element {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-4">
      <span className={cn(loaderVariants({ size }), className)} {...props}>
        <LoaderCircle className="flex size-full animate-rotate-360 animate-duration-800 animate-iteration-count-infinite" />
      </span>
      {children && (
        <span className="text-lg text-muted-foreground">{children}</span>
      )}
    </div>
  )
}
