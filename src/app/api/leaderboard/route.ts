import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  try {
    console.log('Fetching leaderboard from Supabase...')
    
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch top scores from Supabase, ordered by score descending
    const { data: scores, error } = await supabase
      .from('scores')
      .select('player_address, score, created_at')
      .order('score', { ascending: false })
      .limit(50) // Get top 50 scores

    if (error) {
      console.error('Error fetching scores from Supabase:', error)
      // If the table doesn't exist, return empty results instead of error
      if (error.message?.includes('relation "scores" does not exist')) {
        console.log('Scores table does not exist, returning empty results')
        return NextResponse.json({ 
          scores: [],
          count: 0 
        })
      }
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    console.log(`Fetched ${scores?.length || 0} scores from leaderboard`)

    // Return scores in the format expected by frontend
    return NextResponse.json({ 
      scores: scores || [],
      count: scores?.length || 0 
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}