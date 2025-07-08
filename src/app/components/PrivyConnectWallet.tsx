'use client'

import { usePrivy } from '@privy-io/react-auth'

export function PrivyConnectWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()

  if (!ready) return null

  if (authenticated) {
    const address = user?.wallet?.address || user?.email?.address
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : user?.email?.address}
        </span>
        <button 
          onClick={logout}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={login}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
    >
      Connect Wallet
    </button>
  )
}