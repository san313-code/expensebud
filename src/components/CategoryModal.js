import { PALETTE, pickColor } from '../utils.js'

export function CategoryModal({ category, onSave, onClose }) {
  const editing = !!category
  const cat = category || {}

  const el = document.createElement('div')
  el.className = 'modal-overlay'
  el.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${editing ? 'Edit' : 'Add'} category</h3>
        <button class="btn btn-ghost" data-action="close">✕</button>
      </div>
      <form id="cat-form">
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-control" type="text" name="name" value="${cat.name || ''}" placeholder="e.g. Groceries" required>
          </div>
          <div class="form-group">
            <div class="type-toggle" id="cat-type-toggle">
              <button type="button" data-kind="expense" class="${(cat.kind || 'expense') === 'expense' ? 'active expense' : ''}">Expense</button>
              <button type="button" data-kind="income" class="${cat.kind === 'income' ? 'active income' : ''}">Income</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly budget limit (optional)</label>
            <input class="form-control" type="number" step="0.01" min="0" name="budget_limit" value="${cat.budget_limit || ''}" placeholder="No limit">
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div id="color-picker" style="display:flex;gap:6px;flex-wrap:wrap">
              ${PALETTE.map(
                (c, i) =>
                  `<button type="button" data-color="${c}" class="color-swatch" style="width:28px;height:28px;border-radius:6px;border:2px solid ${c === (cat.color || PALETTE[0]) ? 'var(--text)' : 'transparent'};background:${c};cursor:pointer"></button>`
              ).join('')}
            </div>
          </div>
          <div class="form-error" id="cat-form-error" style="display:none"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" data-action="close">Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save' : 'Add'} category</button>
        </div>
      </form>
    </div>
  `

  document.body.appendChild(el)

  const form = el.querySelector('#cat-form')
  const errBox = el.querySelector('#cat-form-error')
  const toggle = el.querySelector('#cat-type-toggle')
  let kind = cat.kind || 'expense'
  let color = cat.color || PALETTE[0]

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]')
    if (!btn) return
    kind = btn.dataset.kind
    toggle.querySelectorAll('button').forEach((b) => {
      b.classList.remove('active', 'expense', 'income')
      if (b.dataset.kind === kind) b.classList.add('active', kind)
    })
  })

  el.querySelector('#color-picker').addEventListener('click', (e) => {
    const sw = e.target.closest('[data-color]')
    if (!sw) return
    color = sw.dataset.color
    el.querySelectorAll('.color-swatch').forEach((s) => {
      s.style.borderColor = s.dataset.color === color ? 'var(--text)' : 'transparent'
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
    const name = fd.get('name').trim()
    if (!name) {
      errBox.textContent = 'Name is required.'
      errBox.style.display = 'block'
      return
    }
    const limit = fd.get('budget_limit')
    const payload = {
      name,
      kind,
      color,
      budget_limit: limit ? parseFloat(limit) : null,
    }
    try {
      await onSave(payload)
      close()
    } catch (err) {
      errBox.textContent = err.message || 'Something went wrong.'
      errBox.style.display = 'block'
    }
  })

  el.querySelector('input[name="name"]')?.focus()
  return el
}
