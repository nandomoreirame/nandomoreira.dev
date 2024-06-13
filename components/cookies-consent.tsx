'use client'

import { useBoolean } from '@/hooks/useBoolean'
import { cn } from '@/lib/utils'
import { Check, CookieIcon } from 'lucide-react'
import { useCookies } from 'next-client-cookies'
import { ComponentProps, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { Container } from './container'

type CookiesConsentProps = ComponentProps<'div'>

const cookieConsentKey = 'site-cookies'
const cookieConsentValue = 'yes'

export function CookiesConsent({
  children,
  className,
  ...props
}: CookiesConsentProps) {
  const [hasConsent, setHasConsent] = useState<string>()
  const { value: showCookiesBox, setValue: setCookiesBox } = useBoolean(false)
  const cookies = useCookies()

  useEffect(() => {
    const _cookieValue = cookies.get(cookieConsentKey)

    if (_cookieValue) {
      setHasConsent(_cookieValue)
    }

    const toRef = setTimeout(() => {
      setCookiesBox(true)
      clearTimeout(toRef)
    }, 1000)
  }, [cookies])

  if (hasConsent === cookieConsentValue) return <></>

  return (
    <div
      className={cn(
        'fixed bottom-2 left-0 right-0 z-99 flex items-center justify-center opacity-0 md:bottom-6',
        'animate-fade-in-up px-8 animate-delay-1000 animate-duration-slow',
        className,
      )}
      {...props}
    >
      <Container size={'xs'}>
        <Alert className="bg-gray-300 shadow-lg dark:bg-gray-900">
          <CookieIcon className="mt- size-6" />
          <AlertTitle className="ml-2 text-xl">Cookies</AlertTitle>
          <AlertDescription className="ml-2 flex flex-col items-center gap-2 md:flex-row">
            <p>
              Este site utiliza cookies, ao continuar a utiliza-lo você concorda
              com nossa política de cookies.
            </p>
            <Button
              variant={'secondary'}
              size={'sm'}
              onClick={() => {
                cookies.set(cookieConsentKey, cookieConsentValue)
                setHasConsent(cookies.get(cookieConsentKey))
              }}
            >
              <Check className="size-4" />
              <span>eu aceito</span>
            </Button>
          </AlertDescription>
        </Alert>
      </Container>
    </div>
  )
}
