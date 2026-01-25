import { clsx, type ClassValue } from 'clsx';

/**
 * Standard className merger without Tailwind specific merging logic
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
