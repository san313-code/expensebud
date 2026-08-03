import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY

if (!url || !anonKey) {
  console.warn('Supabase credentials are missing. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = createClient(url || 'https://example.supabase.co', anonKey || 'public-anon-key', {
  auth: { persistSession: false },
})
