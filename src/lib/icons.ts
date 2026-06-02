/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Dynamic Icon Mapping for Lucide React components.
 * 
 * This utility allows the application to resolve React icon components 
 * from string identifiers stored in Firestore module documents.
 */

import { 
  LayoutDashboard, 
  MessageSquare, 
  GraduationCap, 
  Sparkles, 
  History, 
  FileSearch2, 
  BookOpen, 
  Feather, 
  Puzzle,
  Key,
  School,
  Settings,
  ShieldCheck,
  Languages,
  Scroll,
  PenTool,
  Search,
  Library,
  Globe
} from 'lucide-react';

/**
 * Global map of string identifiers to Lucide icon components.
 */
export const ICON_MAP: Record<string, any> = {
  'layout-dashboard': LayoutDashboard,
  'message-square': MessageSquare,
  'graduation-cap': GraduationCap,
  'sparkles': Sparkles,
  'history': History,
  'file-search': FileSearch2,
  'book-open': BookOpen,
  'feather': Feather,
  'puzzle': Puzzle,
  'key': Key,
  'school': School,
  'settings': Settings,
  'shield-check': ShieldCheck,
  'languages': Languages,
  'scroll': Scroll,
  'pen-tool': PenTool,
  'search': Search,
  'library': Library,
  'globe': Globe
};

/**
 * Resolves an icon component by its string identifier.
 * 
 * @param name The unique identifier for the icon (e.g., 'sparkles').
 * @returns The Lucide icon component, or Globe as a fallback.
 */
export function getIconByName(name: string) {
  return ICON_MAP[name] || Globe;
}
