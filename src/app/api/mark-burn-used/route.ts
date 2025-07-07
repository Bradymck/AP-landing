import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userAddress, txHash } = await request.json()
    
    if (!userAddress || !txHash) {
      return NextResponse.json({ error: 'User address and transaction hash are required' }, { status: 400 })
    }

    // Mark the burn as used
    const { error } = await supabase
      .from('verified_burns')
      .update({ is_used: true })
      .eq('user_address', userAddress.toLowerCase())
      .eq('tx_hash', txHash)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to mark burn as used' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking burn as used:', error)
    return NextResponse.json({ error: 'Failed to mark burn as used' }, { status: 500 })
  }
}