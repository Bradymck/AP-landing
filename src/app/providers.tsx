'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

// Use Base mainnet if you have ARI tokens on Base mainnet
// Use baseSepolia if you have ARI tokens on Base Sepolia testnet
const selectedChain = base  // Change this to baseSepolia if needed

export const config = createConfig({
  chains: [selectedChain],
  transports: {
    [selectedChain.id]: http(),
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
