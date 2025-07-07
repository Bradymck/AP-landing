import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { playerAddress, rewardAmount, scoreId } = await req.json()

    console.log('Generating signature for:', { playerAddress, rewardAmount, scoreId })

    // Get private key from Supabase secrets
    const privateKey = Deno.env.get('BACKEND_SIGNER_PRIVATE_KEY')
    if (!privateKey) {
      console.error('BACKEND_SIGNER_PRIVATE_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'Private key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey)
    console.log('Signer address:', wallet.address)

    // Generate nonce (timestamp + random)
    const nonce = Date.now().toString() + Math.random().toString(36).substring(2)

    // Create message to sign (following EIP-712 or similar pattern)
    // This should match the verification logic in your faucet contract
    const message = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'string'],
      [playerAddress, ethers.parseEther(rewardAmount), scoreId, nonce]
    )

    // Sign the message
    const signature = await wallet.signMessage(ethers.getBytes(message))
    
    console.log('Signature generated:', {
      message: message,
      signature: signature,
      nonce: nonce
    })

    return new Response(
      JSON.stringify({
        signature,
        nonce,
        message,
        signerAddress: wallet.address
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating signature:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})