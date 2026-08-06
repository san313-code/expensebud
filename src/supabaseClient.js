import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY

if (!url || !anonKey) {
  console.warn('Supabase credentials are missing. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = createClient(
  url || 'https://example.supabase.co',
  anonKey || 'public-anon-key',
  {
    auth: { persistSession: true, detectSessionInUrl: true },
  }
)

export async function ensureAuthenticated() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) throw sessionError
    return session
  } catch (error) {
    console.warn('Unable to initialize Supabase auth session:', error.message)
    return null
  }
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message || JSON.stringify(error))
  return data.session
}

export async function signInWithProvider(provider) {
  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    if (error) throw new Error(error.message || JSON.stringify(error))
    return data
  } catch (err) {
    throw err
  }
}

export async function signUpWithEmail(email, password) {
  // Request that Supabase include a redirect back to the app in the confirmation email
  const { data, error } = await supabase.auth.signUp(
    { email, password },
    { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined }
  )
  if (error) throw new Error(error.message || JSON.stringify(error))
  // Return the full data so callers can handle cases where email confirmation is required
  return data
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) throw new Error(error.message || JSON.stringify(error))
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message || JSON.stringify(error))
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw new Error(error.message || JSON.stringify(error))
  return session
}

export async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw new Error(error.message || JSON.stringify(error))
  if (!user?.id) throw new Error('No authenticated user.')
  return user.id
}
