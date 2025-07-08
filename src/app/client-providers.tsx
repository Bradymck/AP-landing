'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the providers to prevent SSR issues
const Providers = dynamic(() => import('./providers').then(mod => mod.Providers), {
  ssr: false,
  loading: () => <></>,
})

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{children}</>
  }

  return (
    <Providers>
      {children}
    </Providers>
  )
}