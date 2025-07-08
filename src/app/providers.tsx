'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia, mainnet, gnosis } from 'wagmi/chains'
import { injected, walletConnect, metaMask } from 'wagmi/connectors'

// Support multiple chains for seamless switching
export const config = createConfig({
  chains: [base, baseSepolia, mainnet, gnosis], // Add common chains user might be on
  connectors: [
    injected(), // MetaMask, Rabby, etc.
    metaMask(), // Specific MetaMask connector for Brave browser compatibility
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'fallback' 
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [mainnet.id]: http(),
    [gnosis.id]: http(),
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
