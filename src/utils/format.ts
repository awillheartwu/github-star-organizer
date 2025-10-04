export function formatDate(input?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!input) return '--'
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date)
}

export function formatNumber(value?: number | null, options?: Intl.NumberFormatOptions) {
  if (value === undefined || value === null) return '--'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
    ...options,
  }).format(value)
}
