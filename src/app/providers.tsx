'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { http } from 'wagmi'
import { base, baseSepolia, mainnet, gnosis } from 'wagmi/chains'
import { PrivyProvider } from '@privy-io/react-auth'
// Import createConfig and WagmiProvider from @privy-io/wagmi for proper Privy integration
import { createConfig, WagmiProvider } from '@privy-io/wagmi'

// Use Privy's createConfig for proper integration with embedded wallets
export const config = createConfig({
  chains: [base, baseSepolia, mainnet, gnosis],
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
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        loginMethods: ['wallet', 'email'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        },
        walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}
