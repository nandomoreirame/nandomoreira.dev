'use client'

import { env } from '@/env'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useAckee } from 'use-ackee'

export function AckeeTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useAckee(
    `${pathname}?${searchParams.toString()}`,
    {
      server: env.NEXT_PUBLIC_ACKEE_SERVER,
      domainId: env.NEXT_PUBLIC_ACKEE_ID,
    },
    {
      detailed: true,
      ignoreLocalhost: false,
      ignoreOwnVisits: false,
    },
  )

  return (
    <Script
      async
      id="ackee-analytics"
      src={`${env.NEXT_PUBLIC_ACKEE_SERVER}/tracker.js`}
      data-ackee-server={`${env.NEXT_PUBLIC_ACKEE_SERVER}`}
      data-ackee-domain-id={`${env.NEXT_PUBLIC_ACKEE_ID}`}
    />
  )
}
