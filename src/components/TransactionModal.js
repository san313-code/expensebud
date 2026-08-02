import { PALETTE, pickColor } from '../utils.js'

export function TransactionModal({
  categories,
  transaction,
  onSave,
  onClose,
}) {
  const editing = !!transaction
  const tx = transaction || {}
  const incomeCats = categories.filter((c) => c.kind === 'income')
  const expenseCats = categories.filter((c) => c.kind === 'expense')

  const el = document.createElement('div')
  el.className = 'modal-overlay'
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${editing ? 'Edit' : 'Add'} transaction</h3>
        <button class="btn btn-ghost" data-action="close">✕</button>
      </div>
      <form id="tx-form">
        <div class="modal-body">
          <div class="form-group">
            <div class="type-toggle" id="type-toggle">
              <button type="button" data-kind="expense" class="${(tx.kind || 'expense') === 'expense' ? 'active expense' : ''}">Expense</button>
              <button type="button" data-kind="income" class="${tx.kind === 'income' ? 'active income' : ''}">Income</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Amount</label>
            <input class="form-control" type="number" step="0.01" min="0.01" name="amount" value="${tx.amount || ''}" placeholder="0.00" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-control" name="category_id" id="cat-select">
                <option value="">Uncategorized</option>
                <optgroup label="Expense" id="opt-expense"></optgroup>
                <optgroup label="Income" id="opt-income"></optgroup>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input class="form-control" type="date" name="date" value="${tx.date || new Date().toISOString().slice(0, 10)}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Note (optional)</label>
            <input class="form-control" type="text" name="note" value="${tx.note || ''}" placeholder="What was this for?">
          </div>
          <div class="form-error" id="form-error" style="display:none"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" data-action="close">Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save' : 'Add'} transaction</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(el)

  const form = el.querySelector('#tx-form')
  const errBox = el.querySelector('#form-error')
  const optExpense = el.querySelector('#opt-expense')
  const optIncome = el.querySelector('#opt-income')
  const catSelect = el.querySelector('#cat-select')
  const toggle = el.querySelector('#type-toggle')
  let kind = tx.kind || 'expense'

  function fillCats() {
    optExpense.innerHTML = expenseCats
      .map(
        (c) =>
          `<option value="${c.id}" ${tx.category_id === c.id ? 'selected' : ''}>${c.name}</option>`
      )
      .join('')
    optIncome.innerHTML = incomeCats
      .map(
        (c) =>
          `<option value="${c.id}" ${tx.category_id === c.id ? 'selected' : ''}>${c.name}</option>`
      )
      .join('')
  }
  fillCats()

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]')
    if (!btn) return
    kind = btn.dataset.kind
    toggle.querySelectorAll('button').forEach((b) => {
      b.classList.remove('active', 'expense', 'income')
      if (b.dataset.kind === kind) {
        b.classList.add('active', kind)
      }
    })
  })

  function close() {
    el.remove()
    onClose && onClose()
  }

  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-action="close"]')) close()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errBox.style.display = 'none'
    const fd = new FormData(form)
    const amount = parseFloat(fd.get('amount'))
    if (!amount || amount <= 0) {
      errBox.textContent = 'Enter a valid amount.'
      errBox.style.display = 'block'
      return
    }
    const payload = {
      amount,
      kind,
      category_id: fd.get('category_id') || null,
      date: fd.get('date'),
      note: fd.get('note') || null,
    }
    try {
      await onSave(payload)
      close()
    } catch (err) {
      errBox.textContent = err.message || 'Something went wrong.'
      errBox.style.display = 'block'
    }
  })

  el.querySelector('input[name="amount"]')?.focus()
  return el
}
