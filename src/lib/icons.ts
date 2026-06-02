
/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
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
  FileSearch, 
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
  Layers,
  NotebookPen,
  Activity,
  UserCheck
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  'layout-dashboard': LayoutDashboard,
  'message-square': MessageSquare,
  'graduation-cap': GraduationCap,
  'sparkles': Sparkles,
  'history': History,
  'file-search': FileSearch,
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
  'layers': Layers,
  'notebook-pen': NotebookPen,
  'activity': Activity,
  'user-check': UserCheck
};

export function getIconByName(name: string) {
  return ICON_MAP[name] || Globe;
}
