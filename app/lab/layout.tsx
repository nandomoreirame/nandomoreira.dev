import { env } from '@/environments'
import { GoogleAnalytics } from '@next/third-parties/google'

export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      {env.NODE_ENV !== 'development' && (
        <GoogleAnalytics gaId={env.GA4_LAB_ID} />
      )}
    </>
  )
}
