import { NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// ERC20 ABI for balanceOf, name, symbol
const erc20Abi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Faucet ABI to get the current token address
const faucetAbi = [
  {
    inputs: [],
    name: 'tokenContractAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function GET() {
  try {
    const faucetAddress = process.env.FAUCET_CONTRACT_ADDRESS || '0x447b964389d9Ff14eBc4EBC92920FD3a69baDc76'

    // Create public client for Base network
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
    })

    // Get the current token address from the faucet contract
    const tokenAddress = await publicClient.readContract({
      address: faucetAddress as `0x${string}`,
      abi: faucetAbi,
      functionName: 'tokenContractAddress'
    })

    console.log(`Reading token from faucet contract: ${tokenAddress}`)

    // Get token metadata
    const [balance, tokenName, tokenSymbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [faucetAddress as `0x${string}`]
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name'
      }).catch(() => 'Unknown Token'),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol'
      }).catch(() => 'UNKNOWN'),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals'
      }).catch(() => 18)
    ])

    // Convert balance using actual decimals
    const faucetBalance = Number(balance) / Math.pow(10, Number(decimals))

    // Get token price from DexScreener
    let tokenPrice = 0
    try {
      console.log(`Fetching price for token: ${tokenAddress}`)
      const priceResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      const priceData = await priceResponse.json()
      
      console.log(`DexScreener response:`, JSON.stringify(priceData, null, 2))
      
      // Find the pair with highest liquidity on Base
      const basePairs = priceData.pairs?.filter((pair: any) => pair.chainId === 'base') || []
      console.log(`Found ${basePairs.length} Base pairs`)
      
      if (basePairs.length > 0) {
        // Sort by FDV or liquidity and take the best one
        const bestPair = basePairs.sort((a: any, b: any) => 
          (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0]
        tokenPrice = parseFloat(bestPair.priceUsd) || 0
        console.log(`Best pair price: $${tokenPrice}`)
      } else {
        console.log('No Base pairs found, trying all chains')
        // Fallback: try any chain if no Base pairs
        if (priceData.pairs && priceData.pairs.length > 0) {
          const bestPair = priceData.pairs.sort((a: any, b: any) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          )[0]
          tokenPrice = parseFloat(bestPair.priceUsd) || 0
          console.log(`Fallback pair price: $${tokenPrice} on ${bestPair.chainId}`)
        }
      }
    } catch (priceError) {
      console.warn('Failed to fetch price from DexScreener:', priceError)
      tokenPrice = 0.01 // Fallback price
    }

    // If still no price found, set a realistic fallback for testing
    if (tokenPrice === 0) {
      console.log('No price found, using minimal fallback price')
      tokenPrice = 0.000001 // $0.000001 per token as fallback (very small)
    }

    const totalValue = faucetBalance * tokenPrice

    // Calculate difficulty based on total pot value
    let difficulty = 1
    if (totalValue >= 100000) difficulty = 5 // $100k+
    else if (totalValue >= 50000) difficulty = 3 // $50k+
    else if (totalValue >= 10000) difficulty = 2 // $10k+
    else if (totalValue >= 5000) difficulty = 1.5 // $5k+
    else difficulty = 1 // Under $5k

    const result = {
      faucetBalance,
      tokenPrice,
      totalValue,
      difficulty,
      tokenInfo: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        decimals: Number(decimals),
        hasPrice: tokenPrice > 0,
        dexScreenerUrl: `https://dexscreener.com/base/${tokenAddress}`
      },
      recentHighScores: [], // TODO: Implement based on your leaderboard
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching faucet info:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch faucet info',
      // Fallback values
      faucetBalance: 100000,
      tokenPrice: 0.01,
      totalValue: 1000,
      difficulty: 1,
      recentHighScores: []
    }, { status: 200 }) // Return 200 with fallback data instead of error
  }
}