export function CategoryManager({ categories, onEdit, onDelete }) {
  const expenseCats = categories.filter((c) => c.kind === 'expense')
  const incomeCats = categories.filter((c) => c.kind === 'income')

  const renderList = (cats) =>
    cats
      .map(
        (c) => `
        <li class="cat-item" data-id="${c.id}">
          <span class="cat-swatch" style="background:${c.color}"></span>
          <span class="cat-name">${c.name}</span>
          ${c.budget_limit ? `<span class="cat-budget">${Number(c.budget_limit).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/mo</span>` : ''}
          <span class="cat-kind ${c.kind}">${c.kind}</span>
          <button class="btn btn-ghost btn-sm" data-action="edit-cat" data-id="${c.id}">✎</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-action="del-cat" data-id="${c.id}">🗑</button>
        </li>
      `
      )
      .join('')

  return `
    <div>
      ${expenseCats.length ? `
        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:0 0 8px">Expense categories</h3>
        <ul class="cat-list">${renderList(expenseCats)}</ul>
      ` : ''}
      ${incomeCats.length ? `
        <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin:16px 0 8px">Income categories</h3>
        <ul class="cat-list">${renderList(incomeCats)}</ul>
      ` : ''}
      ${!expenseCats.length && !incomeCats.length ? '<div class="empty-state"><p>No categories yet.</p></div>' : ''}
    </div>
  `
}
