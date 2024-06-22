import { cn } from '@/lib/utils'
import { ComponentProps } from 'react'

export function LogoName({
  className,
  ...props
}: ComponentProps<'span'>): JSX.Element {
  return (
    <span
      className={cn(
        'text-2xl font-bold transition duration-150 group-hover:text-primary',
        className,
      )}
      {...props}
    >
      nando
      <span className="text-primary transition duration-150 group-hover:text-foreground">
        moreira
      </span>
    </span>
  )
}

export function LogoIcon({
  className,
  ...props
}: ComponentProps<'svg'>): JSX.Element {
  return (
    <span
      className={cn('flex size-12 items-center justify-center p-1', className)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 65 61"
        className={'m-0 flex size-full p-0 transition duration-150'}
        {...props}
      >
        <path
          fill={'currentColor'}
          d="M41.026 36.12V13.182c0-6.354 4.786-11.916 11.13-12.338C59.11.38 64.916 5.906 64.916 12.76v36.006c0 6.474-5.155 11.859-11.63 11.942C39.584 60.88 28.38 49.786 28.38 36.12v-6.172c0-.146.183-.193.256-.063 2.27 4.13 6.66 6.943 11.703 6.938a.7.7 0 0 0 .687-.703Z"
        />
        <path
          fill={'currentColor'}
          d="M24.906 24.708h-.005a.704.704 0 0 0-.703.704s.005 0 .005.005v15.442l-.005-7.015v14.5c0 6.354-4.781 11.916-11.125 12.338C6.12 61.151.313 55.625.313 48.766v-36C.313 6.292 5.468.906 11.937.823 25.642.646 36.85 11.745 36.85 25.41v6.172c0 .146-.188.188-.255.063-2.271-4.13-6.657-6.938-11.688-6.938Z"
        />
      </svg>
      <span className="sr-only">nando moreira</span>
    </span>
  )
}
