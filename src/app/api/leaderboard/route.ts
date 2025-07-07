import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching leaderboard from Supabase...')

    // Fetch top scores from Supabase, ordered by score descending
    const { data: scores, error } = await supabase
      .from('scores')
      .select('player_address, score, created_at')
      .order('score', { ascending: false })
      .limit(50) // Get top 50 scores

    if (error) {
      console.error('Error fetching scores from Supabase:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    console.log(`Fetched ${scores?.length || 0} scores from leaderboard`)

    // Transform the data to match the expected format
    const leaderboard = scores?.map(score => ({
      address: score.player_address,
      score: score.score,
      claimed: false, // We can add this field to track claim status later if needed
      timestamp: score.created_at
    })) || []

    return NextResponse.json({ leaderboard })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}