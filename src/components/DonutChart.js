import { formatCurrency } from '../utils.js'

export function DonutChart({ data, total, label }) {
  const size = 140
  const stroke = 22
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let offset = 0
  const segments = []
  const safeTotal = total > 0 ? total : 1

  for (const item of data) {
    const fraction = item.value / safeTotal
    const length = fraction * circumference
    segments.push(`
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="${item.color}"
        stroke-width="${stroke}"
        stroke-dasharray="${length} ${circumference - length}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${center} ${center})"
        style="transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease"
      />
    `)
    offset += length
  }

  const legend = data
    .map(
      (item) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${item.color}"></span>
        <span class="legend-name">${item.name}</span>
        <span class="legend-val">${formatCurrency(item.value)}</span>
      </div>
    `
    )
    .join('')

  return `
    <div class="donut-wrap">
      <div class="donut">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${center}" cy="${center}" r="${radius}"
            fill="none" stroke="#f1f3f7" stroke-width="${stroke}" />
          ${segments.join('')}
        </svg>
        <div class="donut-center">
          <div class="total">${formatCurrency(total)}</div>
          <div class="label">${label}</div>
        </div>
      </div>
      <div class="donut-legend">
        ${legend || '<div class="legend-item" style="color:var(--text-faint)">No expenses yet</div>'}
      </div>
    </div>
  `
}
