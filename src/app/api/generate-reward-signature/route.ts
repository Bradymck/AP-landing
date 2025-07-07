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

    // 1. Save the score to Supabase
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

    // 2. Check if this score qualifies as a high score (top 10)
    const { data: topScores, error: topScoresError } = await supabase
      .from('scores')
      .select('score')
      .order('score', { ascending: false })
      .limit(10)

    if (topScoresError) {
      console.error('Error fetching top scores:', topScoresError)
      return NextResponse.json({ error: 'Failed to validate high score' }, { status: 500 })
    }

    // Check if the submitted score is in the top 10
    const isHighScore = topScores.length < 10 || score >= topScores[topScores.length - 1].score
    
    if (!isHighScore) {
      console.log('Score does not qualify as high score:', { score, topScores })
      return NextResponse.json({ 
        error: 'Score does not qualify for rewards. Only top 10 scores can claim tokens.',
        isHighScore: false 
      }, { status: 400 })
    }

    console.log('Score qualifies as high score:', { score, topScores })

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