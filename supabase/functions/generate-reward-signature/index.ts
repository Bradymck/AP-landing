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

    // Generate purely numeric nonce to ensure contract compatibility
    // Use simple timestamp to avoid any conversion issues
    const nonce = Date.now()
    const nonceString = nonce.toString()

    // Create message to sign - this must match EXACTLY what the contract expects
    const amountInWei = ethers.parseEther(rewardAmount)
    
    // Contract expects nonce as string, so sign with string nonce
    const packedMessage = ethers.solidityPacked(
      ['address', 'uint256', 'string'],
      [playerAddress, amountInWei, nonceString]
    )
    
    // Hash the packed message
    const messageHash = ethers.keccak256(packedMessage)
    
    // Try both approaches - let's go back to EIP-191 format first
    // Most contracts expect EIP-191 prefixed signatures
    const signature = await wallet.signMessage(ethers.getBytes(messageHash))
    
    console.log('Signature generated:', {
      messageHash: messageHash,
      signature: signature,
      nonce: nonceString,
      playerAddress: playerAddress,
      amountInWei: amountInWei.toString(),
      signerAddress: wallet.address,
      packedMessage: packedMessage
    })
    
    console.log('IMPORTANT: Make sure the faucet contract has this signer address set:', wallet.address)

    return new Response(
      JSON.stringify({
        signature,
        nonce: nonceString,
        messageHash,
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