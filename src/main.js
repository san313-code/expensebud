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
import {
  ensureAuthenticated,
  getCurrentSession,
  resetPassword,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  signInWithProvider,
} from './supabaseClient.js'

const state = {
  categories: [],
  transactions: [],
  month: monthKey(),
  view: 'dashboard',
  loading: true,
  error: null,
  authSession: null,
  authMode: 'signin',
  authEmail: '',
  authPassword: '',
  authPending: false,
  authError: null,
  authSuccess: null,
  authView: 'signin',
  theme: localStorage.getItem('expensebud-theme') || 'light',
}

const app = document.querySelector('#app')

async function load() {
  state.loading = true
  state.error = null
  render()
  try {
    state.authSession = await getCurrentSession()
    await ensureAuthenticated()
    const [categories, transactions] = await Promise.all([
      fetchCategories(),
      fetchTransactions({ month: state.month }),
    ])
    state.categories = categories
    state.transactions = transactions
  }
  catch (err) {
  state.authPending = false
  state.authError = err.message || 'Authentication failed.'
  render()
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

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderBrandMark() {
  return `
    <div class="brand-mark" aria-label="ExpenseBud logo">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="12" width="44" height="40" rx="14" fill="rgba(255,255,255,0.22)" />
        <path d="M22 36H42" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M22 28L29 21L35 27L42 20" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="42" cy="20" r="6" fill="#fbbf24" />
      </svg>
    </div>
  `
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme)
  localStorage.setItem('expensebud-theme', state.theme)
}

function render() {
  const { loading, error, view, month } = state
  applyTheme()

  if (loading && !state.categories.length && !state.authSession?.user) {
    app.innerHTML = renderAuthScreen('Checking your account…')
    return
  }

  if (error) {
    app.innerHTML = `<div class="app"><div class="form-error" style="margin-top:40px">${error}</div></div>`
    return
  }

  if (!state.authSession?.user) {
    app.innerHTML = renderAuthScreen()
    attachEvents()
    return
  }

  const summary = computeSummary()

  app.innerHTML = `
    <div class="app">
      <header class="app-header">
        <div class="brand">
          ${renderBrandMark()}
          <div>
            <h1>ExpenseBud</h1>
            <p>Track expenses, set budgets, stay on course.</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="theme-toggle" id="btn-theme-toggle" type="button" aria-label="Toggle theme">
            <span class="theme-toggle-icon">${state.theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>${state.theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          ${renderAuthCard()}
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

function renderAuthScreen(message = 'Sign in to access your budget dashboard.') {
  const isSignup = state.authMode === 'signup'
  const isForgot = state.authView === 'forgot'

  return `
    <div class="auth-screen">
      <div class="auth-card auth-card-large">
        <div class="auth-hero">
          ${renderBrandMark()}
          <div>
            <h1>Welcome to ExpenseBud</h1>
            <p>${escapeHtml(message)}</p>
          </div>
        </div>
        ${!isForgot ? `<div class="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button class="auth-toggle-btn ${!isSignup ? 'active' : ''}" type="button" id="btn-mode-signin">Sign in</button>
          <button class="auth-toggle-btn ${isSignup ? 'active' : ''}" type="button" id="btn-mode-signup">Create account</button>
        </div>` : ''}
        ${!isForgot ? `<div class="oauth-providers">
          <button class="btn btn-oauth btn-oauth-google" type="button" id="btn-oauth-google">
            <span class="icon"> 
              <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.8 0 6.5 1.6 8 2.9l6-6C34.8 3 29.9 1 24 1 14.9 1 7.2 6.3 3.6 13.8l7.4 5.7C12.9 14.1 18 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.7-.4-3.9H24v7.2h12.6c-.5 3-2.7 6-6.6 7.9l6 4.7C43.8 38 46.5 31.9 46.5 24.5z"/>
                <path fill="#FBBC05" d="M11 28.6c-.6-1.8-1-3.7-1-5.6 0-1.9.4-3.8 1-5.6L3.6 12C2 15.6 1 19.6 1 24s1 8.4 2.6 12l7.4-7.4z"/>
                <path fill="#34A853" d="M24 46c6.1 0 11.2-2 15-5.4l-7.2-5.6c-2 1.3-4.6 2.2-7.8 2.2-6 0-11.1-4.6-12-10.6L3.6 29C7.2 36.7 14.9 42 24 42z"/>
              </svg>
            </span>
            <span class="label">Continue with Google</span>
          </button>
          <button class="btn btn-oauth btn-oauth-github" type="button" id="btn-oauth-github">
            <span class="icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="currentColor" d="M12 .5C5.7.5.8 5.4.8 11.8c0 5 3.3 9.3 7.9 10.8.6.1.8-.2.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.6 1.2 1.6 1.2 1 .1 1.7.7 2.1 1.1.1-.8.4-1.4.7-1.7-2.6-.3-5.2-1.3-5.2-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.3 1.2.9-.3 1.9-.5 2.9-.5s2 .2 2.9.5c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 3 .1 3.3.8.8 1.2 1.9 1.2 3.2 0 4.6-2.6 5.6-5.2 5.9.4.3.8 1 .8 2v3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.8C23.2 5.4 18.3.5 12 .5z"/>
              </svg>
            </span>
            <span class="label">Continue with GitHub</span>
          </button>
          <button class="btn btn-oauth btn-oauth-linkedin" type="button" id="btn-oauth-linkedin">
            <span class="icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#0A66C2" d="M20.447 20.452H17.2v-5.569c0-1.328-.027-3.036-1.852-3.036-1.853 0-2.136 1.447-2.136 2.941v5.664H9.068V9h3.102v1.561h.044c.432-.818 1.488-1.681 3.061-1.681 3.273 0 3.877 2.156 3.877 4.96v6.612zM5.337 7.433c-.99 0-1.793-.804-1.793-1.793 0-.989.803-1.792 1.793-1.792.99 0 1.793.803 1.793 1.792 0 .989-.803 1.793-1.793 1.793zM6.946 20.452H3.727V9h3.219v11.452z"/>
              </svg>
            </span>
            <span class="label">Continue with LinkedIn</span>
          </button>
        </div>` : ''}
        <form id="auth-form" class="auth-form">
          <input class="form-control" type="email" name="auth-email" placeholder="Email" value="${escapeHtml(state.authEmail)}" required>
          ${!isForgot ? `<input class="form-control" type="password" name="auth-password" placeholder="Password" value="${escapeHtml(state.authPassword)}" required>` : ''}
          <div class="auth-actions">
            <button class="btn btn-primary" type="button" id="btn-submit-auth">${isForgot ? 'Send reset link' : (isSignup ? 'Create account' : 'Sign in')}</button>
            ${!isForgot && !isSignup ? `<button class="btn btn-ghost" type="button" id="btn-forgot-password">Forgot password?</button>` : ''}
            ${isForgot ? `<button class="btn btn-ghost" type="button" id="btn-back-to-signin">Back to sign in</button>` : ''}
          </div>
          ${state.authError ? `<div class="form-error">${escapeHtml(state.authError)}</div>` : ''}
          ${state.authSuccess ? `<div class="form-success">${escapeHtml(state.authSuccess)}</div>` : ''}
        </form>
      </div>
    </div>
  `
}

function renderAuthCard() {
  const session = state.authSession

  if (session?.user) {
    const email = session.user.email || 'your account'
    const initials = email
      .split('@')[0]
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U'

    return `
      <div class="profile-pill" id="profile-pill">
        <div class="profile-avatar">${escapeHtml(initials)}</div>
        <div class="profile-meta">
          <div class="profile-name">${escapeHtml(email)}</div>
          <div class="profile-role">Signed in</div>
        </div>
        <button class="profile-action" id="btn-signout" type="button">Sign out</button>
      </div>
    `
  }

  return ''
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

async function handleAuthSubmit(mode) {
  const form = document.getElementById('auth-form')
  if (!form) return

  const emailInput = form.querySelector('[name="auth-email"]')
  const passwordInput = form.querySelector('[name="auth-password"]')
  const email = emailInput?.value?.trim() || ''
  const password = passwordInput?.value || ''

  if (!email) {
    state.authError = 'Please enter your email address.'
    render()
    return
  }

  if (state.authView === 'forgot') {
    state.authPending = true
    state.authError = null
    state.authSuccess = null
    state.authEmail = email
    render()

    try {
      await resetPassword(email)
      state.authPending = false
      state.authSuccess = 'Check your inbox for the reset link.'
      state.authError = null
      render()
    } catch (err) {
      state.authPending = false
      state.authError = err.message || 'Unable to send reset link.'
      render()
    }
    return
  }

  if (!password) {
    state.authError = 'Please enter a password.'
    render()
    return
  }

  state.authPending = true
  state.authError = null
  state.authSuccess = null
  state.authEmail = email
  state.authPassword = password
  render()

  try {
    if (mode === 'signup') {
      const signUpResult = await signUpWithEmail(email, password)
      // If Supabase requires email confirmation, a session may not be returned.
      if (!signUpResult?.session) {
        state.authPending = false
        state.authSuccess = 'Check your inbox to confirm your email address.'
        state.authError = null
        render()
        return
      }
      // otherwise continue and load session
    } else {
      await signInWithEmail(email, password)
    }
    state.authSession = await getCurrentSession()
    state.authEmail = ''
    state.authPassword = ''
    state.authPending = false
    state.authError = null
    state.authSuccess = null
    await load()
  } catch (err) {
    state.authPending = false
    state.authError = err.message || 'Authentication failed.'
    render()
  }
}

async function handleSignOut() {
  try {
    await signOutUser()
    state.authSession = null
    state.authError = null
    await load()
  } catch (err) {
    state.authError = err.message || 'Sign out failed.'
    render()
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  applyTheme()
  render()
}

function attachEvents() {
  document.getElementById('btn-add-tx')?.addEventListener('click', () => openTxModal())
  document.getElementById('btn-categories')?.addEventListener('click', () => {
    state.view = state.view === 'categories' ? 'dashboard' : 'categories'
    render()
    attachEvents()
  })
  document.getElementById('btn-add-cat')?.addEventListener('click', () => openCatModal())
  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme)
  document.getElementById('btn-mode-signin')?.addEventListener('click', () => {
    state.authMode = 'signin'
    render()
  })
  document.getElementById('btn-mode-signup')?.addEventListener('click', () => {
    state.authMode = 'signup'
    render()
  })
  document.getElementById('btn-forgot-password')?.addEventListener('click', () => {
    state.authView = 'forgot'
    state.authError = null
    state.authSuccess = null
    render()
  })
  document.getElementById('btn-back-to-signin')?.addEventListener('click', () => {
    state.authView = 'signin'
    state.authError = null
    state.authSuccess = null
    render()
  })
  document.getElementById('btn-submit-auth')?.addEventListener('click', () => handleAuthSubmit(state.authMode))
  document.getElementById('btn-signout')?.addEventListener('click', () => handleSignOut())
  document.getElementById('btn-oauth-google')?.addEventListener('click', async () => {
    try {
      state.authPending = true
      state.authError = null
      render()
      await signInWithProvider('google')
    } catch (err) {
      state.authPending = false
      state.authError = err.message || 'OAuth sign-in failed.'
      render()
    }
  })
  document.getElementById('btn-oauth-github')?.addEventListener('click', async () => {
    try {
      state.authPending = true
      state.authError = null
      render()
      await signInWithProvider('github')
    } catch (err) {
      state.authPending = false
      state.authError = err.message || 'OAuth sign-in failed.'
      render()
    }
  })
  document.getElementById('btn-oauth-linkedin')?.addEventListener('click', async () => {
    try {
      state.authPending = true
      state.authError = null
      render()
      await signInWithProvider('linkedin')
    } catch (err) {
      state.authPending = false
      state.authError = err.message || 'OAuth sign-in failed.'
      render()
    }
  })
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
