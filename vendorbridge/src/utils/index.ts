import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'status-active',
    approved: 'status-active',
    completed: 'status-completed',
    pending: 'status-pending',
    draft: 'status-draft',
    rejected: 'status-rejected',
    cancelled: 'status-rejected',
    sent: 'status-draft',
  };
  return map[status.toLowerCase()] || 'status-draft';
}

export function truncate(str: string, len = 30): string {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

export function getStatusVariant(status: string): 'default' | 'active' | 'pending' | 'rejected' | 'draft' | 'completed' | 'outline' {
  const map: Record<string, any> = {
    active: 'active',
    approved: 'active',
    completed: 'completed',
    pending: 'pending',
    draft: 'draft',
    rejected: 'rejected',
    cancelled: 'rejected',
    submitted: 'draft',
    sent: 'draft',
    inactive: 'outline',
    pending_approval: 'pending',
  };
  return map[status.toLowerCase()] || 'default';
}
