'use client'

import { Avatar, AvatarImage } from '@/components/avatar'
import { cn } from '@/lib'
import { cva, type VariantProps } from 'class-variance-authority'
import Image from 'next/image'
import { useState, type ComponentProps } from 'react'

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
  const [isLoading, setLoading] = useState(true)

  return (
    <Avatar className={cn(avatarVariants({ size }))}>
      <AvatarImage src={src ?? '/images/photo.png'} asChild>
        <Image
          src={src ?? '/images/photo.png'}
          alt="foto de Fernando Moreira"
          quality={100}
          className={cn(
            'rounded-full bg-primary/10 p-2',
            isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0',
            className,
          )}
          onLoad={() => setLoading(false)}
          width={500}
          height={500}
          priority
        />
      </AvatarImage>
    </Avatar>
  )
}
