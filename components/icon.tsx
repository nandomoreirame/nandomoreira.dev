import { cn } from '@/lib'
import { type LucideProps } from 'lucide-react'
// https://lucide.dev/guide/packages/lucide-react
import { icons } from 'lucide-react'

// Search name in -> https://lucide.dev/icons/
export type IconProps = Omit<LucideProps, 'ref'> & {
  name: string
  className?: string
}

const Icon = ({ name, className, ...props }: IconProps) => {
  // @ts-ignore - TS doesn't know about the icons object
  const LucideIcon = icons[name]

  return (
    <span
      aria-hidden="true"
      className={cn('flex', 'items-center', 'justify-center', className)}
    >
      <LucideIcon aria-hidden="true" className={cn('size-full')} {...props} />
    </span>
  )
}
Icon.displayName = 'Icon'
export { Icon }
