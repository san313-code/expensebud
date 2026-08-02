import './style.css'
import {
  fetchCategories,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createCategory,
  updateCategory,
  deleteCategory,
} from './api.js'
import { formatCurrency, monthKey, monthLabel, shiftMonth } from './utils.js'
import { Toast } from './components/Toast.js'
import { DonutChart } from './components/DonutChart.js'
import { TransactionList } from './components/TransactionList.js'
import { BudgetList } from './components/BudgetList.js'
import { TransactionModal } from './components/TransactionModal.js'
import { CategoryModal } from './components/CategoryModal.js'
import { CategoryManager } from './components/CategoryManager.js'

const state = {
  categories: [],
  transactions: [],
  month: monthKey(),
  view: 'dashboard',
  loading: true,
  error: null,
}

const app = document.querySelector('#app')

async function load() {
  state.loading = true
  state.error = null
  render()
  try {
    const [categories, transactions] = await Promise.all([
      fetchCategories(),
      fetchTransactions({ month: state.month }),
    ])
    state.categories = categories
    state.transactions = transactions
  } catch (err) {
    state.error = err.message || 'Failed to load data.'
  }
  state.loading = false
  render()
}

function computeSummary() {
  let income = 0
  let expense = 0
  const spentByCategory = {}
  const byCategory = {}

  for (const tx of state.transactions) {
    const amt = Number(tx.amount)
    if (tx.kind === 'income') income += amt
    else {
      expense += amt
      const cid = tx.category_id || 'uncategorized'
      spentByCategory[cid] = (spentByCategory[cid] || 0) + amt
      const cat = tx.category
      const key = cat?.id || 'uncategorized'
      if (!byCategory[key]) {
        byCategory[key] = { name: cat?.name || 'Uncategorized', color: cat?.color || '#cbd5e1', value: 0 }
      }
      byCategory[key].value += amt
    }
  }

  return {
    income,
    expense,
    balance: income - expense,
    spentByCategory,
    donutData: Object.values(byCategory).sort((a, b) => b.value - a.value),
  }
}

function render() {
  const { loading, error, view, month } = state

  if (loading && !state.categories.length) {
    app.innerHTML = `<div class="app"><div style="text-align:center;padding:80px 20px;color:var(--text-muted)">Loading your budget…</div></div>`
    return
  }

  if (error) {
    app.innerHTML = `<div class="app"><div class="form-error" style="margin-top:40px">${error}</div></div>`
    return
  }

  const summary = computeSummary()

  app.innerHTML = `
    <div class="app">
      <header class="app-header">
        <div class="brand">
          <div class="brand-mark">B</div>
          <div>
            <h1>ExpenseBud</h1>
            <p>Track expenses, set budgets, stay on course.</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn" id="btn-categories">${view === 'categories' ? 'Back to dashboard' : 'Manage categories'}</button>
          <button class="btn btn-primary" id="btn-add-tx">+ Add transaction</button>
        </div>
      </header>

      ${view === 'dashboard' ? renderDashboard(summary) : renderCategoriesView()}

      <div class="month-nav">
        <button class="month-nav-btn" id="prev-month">← Previous</button>
        <div class="month-nav-title">${monthLabel(month)}</div>
        <button class="month-nav-btn" id="next-month">Next →</button>
      </div>

      ${view === 'dashboard' ? renderDashboardBody(summary) : ''}
    </div>
  `

  attachEvents()
}

function renderDashboard(summary) {
  const { income, expense, balance } = summary
  return `
    <div class="summary-grid">
      <div class="summary-card income">
        <div class="accent-bar"></div>
        <div class="label">↑ Income</div>
        <div class="value">${formatCurrency(income)}</div>
        <div class="sub">This month</div>
      </div>
      <div class="summary-card expense">
        <div class="accent-bar"></div>
        <div class="label">↓ Expenses</div>
        <div class="value">${formatCurrency(expense)}</div>
        <div class="sub">This month</div>
      </div>
      <div class="summary-card balance">
        <div class="accent-bar"></div>
        <div class="label">= Balance</div>
        <div class="value">${formatCurrency(balance)}</div>
        <div class="sub">${balance >= 0 ? 'In the green' : 'Over budget'}</div>
      </div>
    </div>
  `
}

function renderDashboardBody(summary) {
  return `
    <div class="main-grid">
      <div class="card">
        <div class="card-header">
          <h2>Transactions</h2>
          <span style="font-size:13px;color:var(--text-muted)">${state.transactions.length} this month</span>
        </div>
        <div class="card-body">
          <div class="tx-scroll">
            ${TransactionList({ transactions: state.transactions })}
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:24px">
        <div class="card">
          <div class="card-header"><h2>Spending breakdown</h2></div>
          <div class="card-body">
            ${DonutChart({ data: summary.donutData, total: summary.expense, label: 'spent' })}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h2>Budgets</h2></div>
          <div class="card-body">
            ${BudgetList({ categories: state.categories, spentByCategory: summary.spentByCategory })}
          </div>
        </div>
      </div>
    </div>
  `
}

function renderCategoriesView() {
  return `
    <div class="card">
      <div class="card-header">
        <h2>Categories</h2>
        <button class="btn btn-primary btn-sm" id="btn-add-cat">+ Add category</button>
      </div>
      <div class="card-body">
        ${CategoryManager({ categories: state.categories })}
      </div>
    </div>
  `
}

function attachEvents() {
  document.getElementById('btn-add-tx')?.addEventListener('click', () => openTxModal())
  document.getElementById('btn-categories')?.addEventListener('click', () => {
    state.view = state.view === 'categories' ? 'dashboard' : 'categories'
    render()
    attachEvents()
  })
  document.getElementById('btn-add-cat')?.addEventListener('click', () => openCatModal())
  document.getElementById('prev-month')?.addEventListener('click', () => {
    state.month = shiftMonth(state.month, -1)
    load()
  })
  document.getElementById('next-month')?.addEventListener('click', () => {
    state.month = shiftMonth(state.month, 1)
    load()
  })

  document.querySelectorAll('[data-action="edit"]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const tx = state.transactions.find((t) => t.id === btn.dataset.id)
      if (tx) openTxModal(tx)
    })
  )
  document.querySelectorAll('[data-action="delete"]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        await deleteTransaction(btn.dataset.id)
        Toast('Transaction deleted')
        await load()
      } catch (err) {
        Toast(err.message || 'Delete failed', true)
      }
    })
  )
  document.querySelectorAll('[data-action="edit-cat"]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const cat = state.categories.find((c) => c.id === btn.dataset.id)
      if (cat) openCatModal(cat)
    })
  )
  document.querySelectorAll('[data-action="del-cat"]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const cat = state.categories.find((c) => c.id === btn.dataset.id)
      if (!cat) return
      if (!confirm(`Delete category "${cat.name}"? Transactions will be uncategorized.`)) return
      try {
        await deleteCategory(btn.dataset.id)
        Toast('Category deleted')
        await load()
      } catch (err) {
        Toast(err.message || 'Delete failed', true)
      }
    })
  )
}

function openTxModal(transaction) {
  TransactionModal({
    categories: state.categories,
    transaction,
    onSave: async (payload) => {
      if (transaction) {
        await updateTransaction(transaction.id, payload)
        Toast('Transaction updated')
      } else {
        await createTransaction(payload)
        Toast('Transaction added')
      }
      await load()
    },
  })
}

function openCatModal(category) {
  CategoryModal({
    category,
    onSave: async (payload) => {
      if (category) {
        await updateCategory(category.id, payload)
        Toast('Category updated')
      } else {
        await createCategory(payload)
        Toast('Category added')
      }
      await load()
    },
  })
}

load()
