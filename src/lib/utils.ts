import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind + conditional class names.
 * Used by all the UI components (cn("px-4", isActive && "bg-primary")).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}
