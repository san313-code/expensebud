export const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6', '#6366f1', '#84cc16',
]

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'ZAR', label: 'South African Rand' },
  { code: 'NGN', label: 'Nigerian Naira' },
]

export function pickColor(index) {
  return PALETTE[index % PALETTE.length]
}

export function formatCurrency(value, currency = 'USD') {
  const n = Number(value || 0)
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
}

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function monthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [year, m] = key.split('-')
  const d = new Date(Number(year), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function shiftMonth(key, delta) {
  let [year, m] = key.split('-').map(Number)
  m += delta
  while (m < 1) { m += 12; year -= 1 }
  while (m > 12) { m -= 12; year += 1 }
  return `${year}-${String(m).padStart(2, '0')}`
}
