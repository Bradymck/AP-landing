'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { useEffect, useState } from 'react'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isBrave, setIsBrave] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Detect Brave browser
    const detectBrave = () => {
      // @ts-ignore
      if (window.navigator.brave && window.navigator.brave.isBrave) {
        setIsBrave(true)
      }
    }
    detectBrave()
  }, [])

  const handleConnect = async () => {
    try {
      setConnectionError(null)
      
      // For Brave browser, try MetaMask connector first
      if (isBrave) {
        try {
          await connect({ connector: metaMask() })
        } catch (braveError) {
          // If MetaMask fails, try injected as fallback
          await connect({ connector: injected() })
        }
      } else {
        // For other browsers, use injected connector
        await connect({ connector: injected() })
      }
    } catch (err) {
      console.error('Wallet connection error:', err)
      setConnectionError('Failed to connect wallet. Please ensure MetaMask is installed and try again.')
    }
  }

  if (isConnected) {
    return (
      <div>
        <p>Connected as {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={handleConnect} disabled={isPending}>
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {(error || connectionError) && (
        <div style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>
          {connectionError || error?.message}
          {isBrave && (
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              Brave detected. Make sure MetaMask is enabled in extensions.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
