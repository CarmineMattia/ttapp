import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function checkConnection() {
  try {
    console.log('Attempting to connect to Supabase...')
    const { error } = await supabase.auth.getSession()
    if (error) {
      console.error('Connection error:', error.message)
      return false
    }
    console.log('✅ Successfully connected to Supabase')
    return true
  } catch (err) {
    console.error('Connection error:', err)
    return false
  }
}