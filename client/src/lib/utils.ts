import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  // Parse the date string and add 'T00:00:00' to ensure it's treated as start of day in local timezone
  const date = new Date(`${dateString.split('T')[0]}T00:00:00`);
  return format(date, 'MMM d, yyyy')
}