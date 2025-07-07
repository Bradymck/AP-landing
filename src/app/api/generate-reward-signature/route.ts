import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { address, score } = await request.json()
    
    if (!address || !score) {
      return NextResponse.json({ error: 'Address and score are required' }, { status: 400 })
    }

    // TODO: Implement actual signature generation logic
    // For now, return a placeholder response
    const mockSignature = {
      amount: (score * 0.01).toString(), // 0.01 tokens per point
      nonce: Date.now().toString(),
      signature: '0x' + '0'.repeat(130) // Placeholder signature
    }

    return NextResponse.json(mockSignature)
  } catch (error) {
    console.error('Error generating reward signature:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}