import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sorry, I'm temporarily Offline",
}

export default function OfflinePage() {
  return (
    <div className="flex size-full items-center justify-center">
      <p className="mb-4 text-center font-sans text-xl font-light md:text-3xl lg:text-4xl">
        Sorry, I'm temporarily Offline
      </p>
    </div>
  )
}
