
/**
 * @fileOverview Declarative Module Registry for LexiVerse Explorer.
 * Centralizes tool definitions to ensure seamless integration and 
 * prevent architectural fragmentation.
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
  Layers
} from 'lucide-react';
import { ViewMode } from '@/types/scholarly';

export interface ModuleDefinition {
  id: ViewMode;
  labelKey: string; // Key in the locale file (e.g. 'nav.dashboard')
  icon: any;
  group: 'general' | 'ai_hub' | 'governance' | 'profile';
  adminOnly?: boolean;
  path?: string; // If it's an external route rather than a dashboard tab
}

/**
 * DEFAULT_MODULES - The baseline set of scholarly tools.
 * In a managed environment, these are seeded into Firestore for administrative control.
 */
export const DEFAULT_MODULES: ModuleDefinition[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, group: 'general' },
  { id: 'chat', labelKey: 'nav.chat_hub', icon: MessageSquare, group: 'general' },
  { id: 'wiki', labelKey: 'nav.wiki', icon: GraduationCap, group: 'general', path: '/wiki' },
  
  { id: 'ai-assistant', labelKey: 'nav.study_assistant', icon: Sparkles, group: 'ai_hub' },
  { id: 'theology', labelKey: 'nav.theology_map', icon: History, group: 'ai_hub' },
  { id: 'manuscripts', labelKey: 'nav.manuscript_hub', icon: FileSearch2, group: 'ai_hub', path: '/manuscripts' },
  { id: 'lexicon', labelKey: 'nav.lexicon', icon: BookOpen, group: 'ai_hub' },
  { id: 'synthesis', labelKey: 'nav.synthesis', icon: Feather, group: 'ai_hub' },
  { id: 'boilerplate', labelKey: 'nav.boilerplate', icon: Puzzle, group: 'ai_hub' }
];

export const GOVERNANCE_MODULES: ModuleDefinition[] = [
  { id: 'profile', labelKey: 'nav.api_portal', icon: Key, group: 'governance', path: '/api-keys' },
  { id: 'dashboard', labelKey: 'nav.admin_api', icon: Key, group: 'governance', adminOnly: true, path: '/admin/api' },
  { id: 'dashboard', labelKey: 'nav.institutions', icon: School, group: 'governance', adminOnly: true, path: '/admin/institutions' },
  { id: 'dashboard', labelKey: 'nav.system_control', icon: Settings, group: 'governance', adminOnly: true, path: '/admin/settings' },
  { id: 'dashboard', labelKey: 'nav.module_governance', icon: Layers, group: 'governance', adminOnly: true, path: '/admin/modules' }
];
