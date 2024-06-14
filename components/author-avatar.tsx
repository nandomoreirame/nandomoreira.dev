'use client'

import { Avatar, AvatarImage } from '@/components/avatar'
import { useBoolean } from '@/hooks/useBoolean'
import { cn } from '@/lib'
import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'
import { type ComponentProps } from 'react'

const avatarVariants = cva('size-full md:max-w-lg', {
  variants: {
    size: {
      default: 'max-w-32 md:size-32',
      md: 'max-w-52 md:size-52',
      sm: 'max-w-20 md:size-20',
      lg: 'max-w-64 md:size-64',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

interface AuthorAvatarProps
  extends ComponentProps<'div'>,
    VariantProps<typeof avatarVariants> {
  src?: string
}

export function AuthorAvatar({
  className,
  size,
  src,
}: AuthorAvatarProps): JSX.Element {
  const { value: isLoading, setFalse } = useBoolean(false)

  return (
    <Avatar className={cn(avatarVariants({ size }), 'group')}>
      <AvatarImage src={src ?? '/images/photo.png'} asChild>
        <Image
          src={src ?? '/images/photo.png'}
          alt="foto de Fernando Moreira - indie hacker e desenvolvedor full-stack"
          quality={100}
          className={cn(
            'rounded-full bg-primary/10 p-2 transition-all duration-300 ease-in-out',
            'group-hover:bg-primary group-hover:p-1',
            isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0',
            className,
          )}
          onLoad={() => setFalse()}
          width={300}
          height={300}
          priority
        />
      </AvatarImage>
    </Avatar>
  )
}
