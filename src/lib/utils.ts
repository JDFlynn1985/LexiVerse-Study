
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from "crypto-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a Gravatar URL based on the provided email.
 * @param email The user's email address.
 * @param size The requested image size (default 200).
 * @returns A Gravatar URL string.
 */
export function getGravatarUrl(email: string, size: number = 200): string {
  if (!email) return `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=mp`;
  const hash = CryptoJS.MD5(email.trim().toLowerCase()).toString();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}
