'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useState } from 'react'
import { Wallet, ExternalLink, Copy, Settings, LogOut } from 'lucide-react'

export default function PrivyConnectWallet() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const [showManagement, setShowManagement] = useState(false)

  if (!ready) return null

  if (authenticated) {
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
    const externalWallet = wallets.find(w => w.walletClientType !== 'privy')
    const activeWallet = embeddedWallet || externalWallet
    const address = activeWallet?.address || user?.email?.address

    const copyAddress = () => {
      if (address) {
        navigator.clipboard.writeText(address)
      }
    }

    const openBlockExplorer = () => {
      if (address) {
        window.open(`https://basescan.org/address/${address}`, '_blank')
      }
    }

    return (
      <div className="relative">
        <button 
          onClick={() => setShowManagement(!showManagement)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium text-white shadow-lg transition-all duration-200"
        >
          <Wallet className="w-4 h-4" />
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : user?.email?.address}
        </button>

        {showManagement && (
          <div className="absolute top-full mt-2 right-0 bg-white/10 backdrop-blur-md border border-purple-500/30 rounded-lg p-4 min-w-[280px] z-50">
            <div className="space-y-3">
              {/* Address Display */}
              <div className="text-sm">
                <p className="text-purple-300 mb-1">Address:</p>
                <p className="text-white font-mono text-xs break-all bg-black/20 p-2 rounded">
                  {address}
                </p>
              </div>

              {/* Wallet Type */}
              <div className="text-sm">
                <p className="text-purple-300 mb-1">Wallet Type:</p>
                <p className="text-white">
                  {embeddedWallet ? 'Embedded Wallet' : 'External Wallet'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-2 border-t border-purple-500/30">
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600/50 hover:bg-purple-600 rounded transition-colors text-white"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>
                
                <button 
                  onClick={openBlockExplorer}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600/50 hover:bg-blue-600 rounded transition-colors text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on BaseScan
                </button>

                {embeddedWallet && (
                  <button 
                    onClick={() => embeddedWallet.fund()}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600/50 hover:bg-green-600 rounded transition-colors text-white"
                  >
                    <Settings className="w-4 h-4" />
                    Top Up Wallet
                  </button>
                )}
                
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600/50 hover:bg-red-600 rounded transition-colors text-white"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <button 
      onClick={login}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium text-white shadow-lg transition-all duration-200"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </button>
  )
}