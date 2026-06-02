import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, resolving conflicts.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (USD).
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

/**
 * Format an ISO date string to a readable local date/time.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/**
 * Truncate a string to `maxLength` characters.
 */
export function truncate(str, maxLength = 40) {
  if (!str) return ''
  return str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Get order status colour classes.
 */
export function getStatusColor(status) {
  const map = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    processing: 'bg-primary/15 text-primary border-primary/30',
    completed: 'bg-success/15 text-success border-success/30',
    cancelled: 'bg-destructive/15 text-destructive border-destructive/30',
  }
  return map[status?.toLowerCase()] ?? 'bg-muted text-muted-foreground border-border'
}

/**
 * Get stock level colour classes.
 */
export function getStockColor(quantity) {
  if (quantity === 0) return 'text-destructive'
  if (quantity <= 10) return 'text-warning'
  return 'text-success'
}
