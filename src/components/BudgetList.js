import { formatCurrency } from '../utils.js'

export function BudgetList({ categories, spentByCategory, currency = 'USD' }) {
  const expenseCats = categories.filter((c) => c.kind === 'expense')

  if (!expenseCats.length) {
    return `<div class="empty-state"><p>No expense categories yet.</p></div>`
  }

  const items = expenseCats
    .map((cat) => {
      const spent = spentByCategory[cat.id] || 0
      const limit = cat.budget_limit ? Number(cat.budget_limit) : null

      if (!limit) {
        return `
          <div class="budget-item">
            <div class="budget-head">
              <span class="budget-name">
                <span class="budget-swatch" style="background:${cat.color}"></span>
                ${cat.name}
              </span>
              <span class="budget-amounts"><span class="spent">${formatCurrency(spent, currency)}</span> spent</span>
            </div>
            <div class="budget-bar"><div class="budget-fill" style="width:0%"></div></div>
            <div class="budget-no-limit">No monthly limit set</div>
          </div>
        `
      }

      const pct = Math.min((spent / limit) * 100, 100)
      const over = spent > limit
      const near = !over && pct >= 80
      const cls = over ? 'over' : near ? 'near' : 'ok'
      const status = over
        ? `${formatCurrency(spent - limit, currency)} over budget`
        : `${formatCurrency(limit - spent, currency)} left`

      return `
        <div class="budget-item">
          <div class="budget-head">
            <span class="budget-name">
              <span class="budget-swatch" style="background:${cat.color}"></span>
              ${cat.name}
            </span>
            <span class="budget-amounts">
              <span class="spent">${formatCurrency(spent, currency)}</span> / ${formatCurrency(limit, currency)}
            </span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${cls}" style="width:${pct}%;background:${cat.color}"></div>
          </div>
          <div class="budget-status ${cls}">${status}</div>
        </div>
      `
    })
    .join('')

  return items
}
