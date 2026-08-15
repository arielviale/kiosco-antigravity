import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : 'https://placeholder.supabase.co'

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
