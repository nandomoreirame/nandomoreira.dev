'use client'

import { cn } from '@/lib/utils'
import { Check, CookieIcon } from 'lucide-react'
import { useCookies } from 'next-client-cookies'
import { ComponentProps, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { Container } from './container'
import { DialogOverlay, DialogPortal, DialogRoot } from './dialog'

type CookiesConsentProps = ComponentProps<'div'>

const cookieConsentKey = 'site-cookies'
const cookieConsentValue = 'yes'

export function CookiesConsent({
  children,
  className,
  ...props
}: CookiesConsentProps) {
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
    <DialogRoot open={showCookiesBox}>
      <DialogPortal>
        <DialogOverlay />
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
              <CookieIcon className="size-5" />
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
      </DialogPortal>
    </DialogRoot>
  )
}
