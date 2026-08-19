import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely, handling conflicts.
 * Usage: cn('px-4 py-2', isActive && 'bg-orange-500')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a human-readable string.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Get the initials from a full name (up to 2 characters).
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Construct the redirect URL for post-auth flows based on user role.
 */
export function getDashboardPath(role: 'engineer' | 'client' | 'admin'): string {
  const paths = {
    engineer: '/engineer/dashboard',
    client: '/client/dashboard',
    admin: '/admin/dashboard',
  }
  return paths[role]
}
