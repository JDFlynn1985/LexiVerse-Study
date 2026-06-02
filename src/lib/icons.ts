/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * Under this license, you are free to copy, redistribute, and adapt this code,
 * provided you follow these conditions:
 *  - Attribution: You must give appropriate credit to Joshua Flynn.
 *  - NonCommercial: You may not use this material for commercial purposes.
 *  - ShareAlike: If you alter, transform, or build upon this code, you must 
 *    distribute your contributions under the same license as the original.
 */

/**
 * @fileOverview Dynamic Icon Mapping for Lucide React components.
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
  Globe,
  Layers
} from 'lucide-react';

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
  'globe': Globe,
  'layers': Layers
};

export function getIconByName(name: string) {
  return ICON_MAP[name] || Globe;
}
