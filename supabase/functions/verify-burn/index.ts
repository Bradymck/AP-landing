import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from 'https://esm.sh/ethers@6.7.0'

// CORS headers to allow requests from browser-based clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Be more specific in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal ABI for the ERC20 'Transfer' event
const erc20Abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

console.log("Starting verify-burn function...");

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize clients and get secrets from environment
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const provider = new ethers.JsonRpcProvider(Deno.env.get('MAINNET_RPC_URL')!)
    const signer = new ethers.Wallet(Deno.env.get('BACKEND_SIGNER_PRIVATE_KEY')!, provider)
    
    const tokenBurnAddress = Deno.env.get('TOKEN_TO_BURN_ADDRESS')!
    const requiredBurnAmount = BigInt(Deno.env.get('REQUIRED_BURN_AMOUNT')!)

    // 3. Get player address from request body
    const { playerAddress } = await req.json()
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing player address' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    console.log(`Processing request for player: ${playerAddress}`);

    // 4. Verify high score exists in the database
    // This is a basic check. A real implementation should also check if the
    // score has already been used to claim a reward.
    const { data: scoreData, error: scoreError } = await supabase
      .from('scores')
      .select('id') // Only select 'id' for efficiency
      .eq('player_address', playerAddress)
      .limit(1)

    if (scoreError) throw new Error(`Database error: ${scoreError.message}`);
    if (!scoreData || scoreData.length === 0) {
       return new Response(JSON.stringify({ error: 'No high score found for this address.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }
    console.log(`High score verified for player: ${playerAddress}`);

    // 5. Verify the token burn transaction on-chain
    const tokenContract = new ethers.Contract(tokenBurnAddress, erc20Abi, provider);
    const filter = tokenContract.filters.Transfer(playerAddress, tokenBurnAddress);
    // Check a reasonable range of recent blocks
    const events = await tokenContract.queryFilter(filter, 'latest-10000', 'latest');

    const hasBurnedEnough = events.some(event => event.args && event.args.value >= requiredBurnAmount);

    if (!hasBurnedEnough) {
      return new Response(JSON.stringify({ error: 'Token burn verification failed. No sufficient burn transaction found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      })
    }
    console.log(`Token burn verified for player: ${playerAddress}`);

    // 6. Generate the signature for the reward claim
    const rewardAmount = ethers.parseEther('10'); // Placeholder: 10 reward tokens
    const nonce = Date.now();

    const messageHash = ethers.solidityPackedKeccak256(
        ['address', 'uint256', 'uint256'],
        [playerAddress, rewardAmount, nonce]
    );

    const signature = await signer.signMessage(ethers.getBytes(messageHash));
    console.log(`Signature generated for player: ${playerAddress}`);

    // 7. Return the necessary data to the client
    const responseData = {
        amount: rewardAmount.toString(),
        nonce: nonce.toString(),
        signature: signature
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('An error occurred:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
