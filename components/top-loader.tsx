'use client'

import { useTheme } from 'next-themes'
import NextTopLoader from 'nextjs-toploader'
import { useEffect, useState } from 'react'

export function TopLoader(): JSX.Element {
  const [isMounted, setIsMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const primaryColor = resolvedTheme === 'dark' ? '#ffde59' : '#481fff'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <></>

  return (
    <NextTopLoader
      color={primaryColor}
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={true}
      easing="ease"
      speed={200}
      shadow={`0 0 10px ${primaryColor}, 0 0 5px ${primaryColor}`}
    />
  )
}
