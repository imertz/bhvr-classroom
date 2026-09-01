import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats date strings without timezone shifts
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const datePart = dateString.split('T')[0];
  if (!datePart) return dateString;
  const parts = datePart.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10) - 1;
    const day = parseInt(parts[2]!, 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day).toLocaleDateString();
    }
  }
  return new Date(dateString).toLocaleDateString();
}

/**
 * Formats full datetime strings
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}
