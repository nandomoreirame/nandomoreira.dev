'use client'

import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { LinkIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { toast } from 'sonner'

type AnchorProps = {
  anchor?: string
  label?: string | React.ReactNode
  anchorVisibility?: 'hover' | 'always' | 'never'
  disableCopyToClipboard?: boolean
}

const Anchor = ({
  anchor,
  label,
  disableCopyToClipboard = false,
  anchorVisibility = 'always',
}: AnchorProps) => {
  async function copyToClipboard() {
    if (disableCopyToClipboard) return

    const currentUrl = window.location.href.replace(/#.*$/, '')
    const urlWithId = `${currentUrl}#${anchor}`

    try {
      await navigator.clipboard.writeText(urlWithId)
      toast.success('o link foi copiado para área de transferência!')
    } catch (error) {
      console.error('[ Error copying to clipboard ]', error)
    }
  }

  return (
    <span
      className={cn(
        'ms-2 mt-2 inline-flex',
        anchorVisibility === 'always' && 'visible',
        anchorVisibility === 'never' && 'hidden',
        anchorVisibility === 'hover' && 'invisible group-hover:visible',
      )}
    >
      <Link href={`#${anchor}`} onClick={copyToClipboard}>
        <LinkIcon className="text-gray-600 hover:text-gray-400" />
        {label && <span className="sr-only">{label}</span>}
      </Link>
    </span>
  )
}

const headingVariants = cva('text-foreground my-8 font-bold', {
  variants: {
    variant: {
      h2: 'leading-14 text-3xl lg:text-4xl',
      h3: 'leading-10 text-2xl lg:text-3xl',
      h4: 'leading-8 text-xl lg:text-2xl',
    },
  },
  defaultVariants: {
    variant: 'h2',
  },
})

type BaseHeadingProps = {
  children?: React.ReactNode
  variant?: string
  className?: string
  asChild?: boolean
  anchor?: string
  anchorAlignment?: 'close' | 'spaced'
  anchorVisibility?: 'hover' | 'always' | 'never'
  disableCopyToClipboard?: boolean
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>

const BaseHeading = ({
  children,
  className,
  variant = 'h2',
  asChild = false,
  anchor,
  anchorAlignment = 'spaced',
  anchorVisibility = 'always',
  disableCopyToClipboard = false,
  ...props
}: BaseHeadingProps) => {
  const Comp = asChild ? Slot : variant
  return (
    <Comp
      id={anchor}
      {...props}
      className={cn(
        // anchor && 'flex scroll-m-20 items-center gap-1', // modify `scroll-m-20` according to your header height.
        anchorAlignment === 'spaced' && 'justify-between',
        anchorVisibility === 'hover' && 'group',
        headingVariants({ variant, className }),
      )}
    >
      {children}
      {anchor && (
        <Anchor
          anchor={anchor}
          label={children}
          anchorVisibility={anchorVisibility}
          disableCopyToClipboard={disableCopyToClipboard}
        />
      )}
    </Comp>
  )
}

type TypographyProps = Omit<BaseHeadingProps, 'variant' | 'asChild'>

const H2 = (props: TypographyProps) => {
  return <BaseHeading {...props} variant="h2" />
}

const H3 = (props: TypographyProps) => {
  return <BaseHeading {...props} variant="h3" />
}

const H4 = (props: TypographyProps) => {
  return <BaseHeading {...props} variant="h4" />
}

export { H2, H3, H4 }
