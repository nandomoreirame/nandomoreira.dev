import { Card } from '@/components/card'
import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

type NotionCalloutProps = ComponentProps<'div'>

export function NotionCallout({
  children,
  className,
  ...props
}: NotionCalloutProps): JSX.Element {
  return (
    <Card className={cn('callout', className)} {...props}>
      {/* TODO: get callout icon
      {'icon' in callout && (
        <div>{'emoji' in callout?.icon ? callout.icon?.emoji : null}</div>
      )} */}
      <>{children}</>
    </Card>
  )
}
