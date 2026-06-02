'use server';

/**
 * @fileOverview Server-side authentication and validation actions.
 * Enforces strict security policies for scholar account management.
 */

import { sanitizeHtml } from '@/lib/sanitization';

/**
 * Validates a proposed password against identity components on the server.
 * This provides the authoritative security check before account creation.
 */
export async function validateScholarPassword(password: string, name: string, email: string, birthday: string) {
  const normalizedPass = password.toLowerCase();
  const cleanName = sanitizeHtml(name);
  const cleanEmail = sanitizeHtml(email);
  
  // 1. Name component check
  const nameParts = cleanName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
  for (const part of nameParts) {
    if (normalizedPass.includes(part)) {
      return { 
        valid: false, 
        error: `Password cannot contain components of your name ("${part}").` 
      };
    }
  }

  // 2. Email identity check
  const emailPrefix = cleanEmail.toLowerCase().split('@')[0];
  if (emailPrefix.length > 2 && normalizedPass.includes(emailPrefix)) {
    return { valid: false, error: "Password cannot contain your email username." };
  }
  if (normalizedPass.includes(cleanEmail.toLowerCase())) {
    return { valid: false, error: "Password cannot contain your full email address." };
  }

  // 3. Birthday component check
  if (birthday) {
    const [year, month, day] = birthday.split('-');
    if (normalizedPass.includes(year)) {
      return { valid: false, error: "Password cannot contain your birth year." };
    }
    // Check month and day (only if 2 digits)
    if (month.length > 1 && normalizedPass.includes(month)) {
      return { valid: false, error: "Password cannot contain your birth month." };
    }
    if (day.length > 1 && normalizedPass.includes(day)) {
      return { valid: false, error: "Password cannot contain your birth day." };
    }
  }

  // 4. Basic strength check (Server-side enforcement)
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }

  return { valid: true };
}
