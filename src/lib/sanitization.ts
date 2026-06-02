
/**
 * LexiVerse Explorer
 * Copyright (c) 2026. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Standardized sanitization utilities for user-provided inputs.
 * Prevents XSS and ensures data integrity before processing or storage.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Strips all HTML tags from a string. 
 * Use for simple text inputs like search terms, names, and chat messages.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitizes rich text content while allowing basic scholarly formatting.
 * Use for Wiki article content or deep exegesis notes.
 */
export function sanitizeRichText(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_PROTOCOL_RELATIVE: false,
  });
}
