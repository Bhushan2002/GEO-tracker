import { clsx, type ClassValue } from "clsx"
import { google } from "googleapis";
import { twMerge } from "tailwind-merge"

/**
 * Utility for conditionally merging Tailwind CSS classes.
 * Combines `clsx` (for conditional logic) and `tw-merge` (for resolving conflicts).
 * 
 * @param inputs - List of class names or conditional class objects.
 * @returns A single merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

