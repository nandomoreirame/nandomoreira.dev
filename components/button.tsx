'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'flex xs:inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 lowercase',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-primary hover:ring-2 hover:ring-offset-2',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-gray-900/10 dark:border-gray-400/10 bg-transparent hover:bg-primary hover:boder-primary hover:text-primary-foreground',
        secondary:
          'text-white bg-gray-950 hover:bg-gray-900 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-gray-200 dark:focus-visible:ring-gray-100',
        ghost: 'bg-transparent hover:bg-gray-800/10 dark:hover:bg-gray-100/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot ref={ref} {...props}>
          <>
            {React.Children.map(
              children as React.ReactElement,
              (child: React.ReactElement) => {
                return React.cloneElement(child, {
                  className: cn(buttonVariants({ variant, size }), className),
                  children: (
                    <>
                      {loading && (
                        <Loader2
                          className={cn(
                            'h-4 w-4 animate-spin',
                            children && 'mr-2',
                          )}
                        />
                      )}
                      {child.props.children}
                    </>
                  ),
                })
              },
            )}
          </>
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={loading}
        ref={ref}
        {...props}
      >
        <>
          {loading && (
            <Loader2
              className={cn('h-4 w-4 animate-spin', children && 'mr-2')}
            />
          )}
          {children}
        </>
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
