import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine des classes Tailwind en évitant les conflits.
 * Usage : cn('px-4 py-2', condition && 'bg-red-500', 'hover:bg-red-400')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
