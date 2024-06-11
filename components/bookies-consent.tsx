'use client'

import { cn } from '@/lib/utils'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { Check, Info } from 'lucide-react'
import { useCookies } from 'next-client-cookies'
import React, { ComponentProps, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { Container } from './container'

type BookiesConsentProps = ComponentProps<'div'>

const cookieConsentKey = 'site-cookies'
const cookieConsentValue = 'yes'

const BookiesConsentRoot = SheetPrimitive.Root
const BookiesConsentPortal = SheetPrimitive.Portal

const BookiesConsentOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
    ref={ref}
  />
))

export function BookiesConsent({
  children,
  className,
  ...props
}: BookiesConsentProps) {
  const [hasConsent, setHasConsent] = useState<string>()
  const [showCookiesBox, setShowCookiesBox] = useState(false)
  const cookies = useCookies()

  useEffect(() => {
    const _cookieValue = cookies.get(cookieConsentKey)

    if (_cookieValue) {
      setHasConsent(_cookieValue)
    }

    const toRef = setTimeout(() => {
      setShowCookiesBox(true)
      clearTimeout(toRef)
    }, 1000)
  }, [cookies])

  if (hasConsent === cookieConsentValue) return <></>

  return (
    <BookiesConsentRoot open={showCookiesBox}>
      <BookiesConsentPortal>
        <BookiesConsentOverlay />
        <div
          className={cn(
            'fixed bottom-2 left-0 right-0 z-99 flex items-center justify-center opacity-0 md:bottom-6',
            'animate-[appear_500ms_cubic-bezier(0.4,_0,_0.2,_1)_500ms_both]',
            className,
          )}
          {...props}
        >
          <Container size={'xs'}>
            <Alert className="bg-gray-300 shadow-lg dark:bg-gray-900">
              <Info className="size-4" />
              <AlertTitle>Cookies</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 md:flex-row">
                <p>
                  Este site utiliza cookies, ao continuar a utiliza-lo você
                  concorda com nossa política de cookies.
                </p>
                <Button
                  onClick={() => {
                    cookies.set(cookieConsentKey, cookieConsentValue)
                    setHasConsent(cookies.get(cookieConsentKey))
                  }}
                >
                  <Check className="size-4" />
                  <span>Eu aceito</span>
                </Button>
              </AlertDescription>
            </Alert>
          </Container>
        </div>
      </BookiesConsentPortal>
    </BookiesConsentRoot>
  )
}
