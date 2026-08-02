import { supabase } from './supabaseClient.js'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('kind')
    .order('name')
  if (error) throw error
  return data
}

export async function createCategory(payload) {
  const { data, error } = await supabase
    .from('categories')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id, payload) {
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTransactions({ month } = {}) {
  let query = supabase
    .from('transactions')
    .select('*, category:categories(id, name, color, kind)')
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
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*, category:categories(id, name, color, kind)')
    .single()
  if (error) throw error
  return data
}

export async function updateTransaction(id, payload) {
  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .select('*, category:categories(id, name, color, kind)')
    .single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
