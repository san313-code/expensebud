import { formatCurrency, formatDate } from '../utils.js'

export function TransactionList({ transactions, onEdit, onDelete, currency = 'USD' }) {
  if (!transactions.length) {
    return `
      <div class="empty-state">
        <div class="icon">+</div>
        <p>No transactions yet this month.</p>
        <p style="font-size:13px;margin-top:4px">Click "Add transaction" to get started.</p>
      </div>
    `
  }

  const items = transactions
    .map(
      (tx) => `
      <li class="tx-item" data-id="${tx.id}">
        <div class="tx-dot" style="background:${tx.category?.color || '#cbd5e1'}22;color:${tx.category?.color || '#64748b'}">
          ${tx.kind === 'income' ? '↑' : '↓'}
        </div>
        <div class="tx-main">
          <div class="tx-cat">${tx.category?.name || 'Uncategorized'}</div>
          <div class="tx-note">${tx.note || formatDate(tx.date)}</div>
        </div>
        <div class="tx-date">${formatDate(tx.date)}</div>
        <div class="tx-amount ${tx.kind}">
          ${tx.kind === 'income' ? '+' : '−'}${formatCurrency(tx.amount, currency)}
        </div>
        <div class="tx-actions">
          <button class="btn btn-ghost btn-sm" data-action="edit" data-id="${tx.id}" title="Edit">✎</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-action="delete" data-id="${tx.id}" title="Delete">🗑</button>
        </div>
      </li>
    `
    )
    .join('')

  return `<ul class="tx-list">${items}</ul>`
}
