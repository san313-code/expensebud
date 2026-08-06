import { supabase, getCurrentUserId } from './supabaseClient.js'

export async function fetchCategories() {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('kind')
    .order('name')
  if (error) throw error
  return data
}

export async function createCategory(payload) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...payload, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id, payload) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchTransactions({ month } = {}) {
  const userId = await getCurrentUserId()
  let query = supabase
    .from('transactions')
    .select('*, category:categories(id, name, color, kind)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (month) {
    const [year, m] = month.split('-')
    const start = `${year}-${m}-01`
    const end = `${year}-${m}-31`
    query = query.gte('date', start).lte('date', end)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createTransaction(payload) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...payload, user_id: userId })
    .select('*, category:categories(id, name, color, kind)')
    .single()
  if (error) throw error
  return data
}

export async function updateTransaction(id, payload) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*, category:categories(id, name, color, kind)')
    .single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id) {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}
