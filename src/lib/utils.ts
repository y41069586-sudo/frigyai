import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse JSON string and return fallback if parsing fails
 * @param jsonString - JSON string to parse
 * @param fallback - Value to return if parsing fails (default: null)
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = unknown>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}
