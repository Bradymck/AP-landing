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

    console.log('Saving score to Supabase:', { address, score })

    // 1. Always save the score to Supabase first
    const { data: savedScore, error: saveError } = await supabase
      .from('scores')
      .insert([{ player_address: address, score }])
      .select()
      .single()

    if (saveError) {
      console.error('Error saving score to Supabase:', saveError)
      return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
    }

    console.log('Score saved successfully:', savedScore)

    // 2. Check if this score qualifies as THE high score (only #1 gets rewards)
    const { data: topScores, error: topScoresError } = await supabase
      .from('scores')
      .select('score')
      .order('score', { ascending: false })
      .limit(2) // Get top 2 to compare

    if (topScoresError) {
      console.error('Error fetching top scores:', topScoresError)
      return NextResponse.json({ error: 'Failed to validate high score' }, { status: 500 })
    }

    // Check if the submitted score is THE highest score
    const isTopScore = topScores.length > 0 && score === topScores[0].score
    
    if (!isTopScore) {
      console.log('Score does not qualify as top score:', { score, topScore: topScores[0]?.score })
      return NextResponse.json({ 
        error: 'Score does not qualify for rewards. Only the highest score can claim tokens.',
        isHighScore: false,
        scoreId: savedScore.id
      }, { status: 400 })
    }

    console.log('Score qualifies as new high score:', { score, topScore: topScores[0]?.score })

    // 3. Calculate reward amount (0.01 Moonstone per point)
    const rewardAmount = (score * 0.01).toString()
    
    // 4. Generate signature using Supabase Edge Function
    console.log('Calling Supabase edge function for signature generation...')
    
    const { data: signatureData, error: signatureError } = await supabase.functions.invoke('generate-reward-signature', {
      body: {
        playerAddress: address,
        rewardAmount,
        scoreId: savedScore.id
      }
    })

    if (signatureError) {
      console.error('Error calling edge function:', signatureError)
      return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
    }

    console.log('Signature generated successfully:', signatureData)

    return NextResponse.json({
      amount: rewardAmount,
      nonce: signatureData.nonce,
      signature: signatureData.signature,
      scoreId: savedScore.id
    })

  } catch (error) {
    console.error('Error generating reward signature:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}