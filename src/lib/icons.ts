
/**
 * @fileOverview Dynamic Icon Mapping for Lucide React components.
 * This utility allows us to resolve icon components from string names stored in Firestore.
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
 * Returns Globe as a fallback if the icon is not found.
 */
export function getIconByName(name: string) {
  return ICON_MAP[name] || Globe;
}
