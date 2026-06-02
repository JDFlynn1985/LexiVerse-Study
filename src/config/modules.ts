/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Declarative Module Registry for LexiVerse Explorer.
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
  Layers,
  Activity,
  Library
} from 'lucide-react';
import { ViewMode } from '@/types/scholarly';

/**
 * Metadata for a LexiVerse module.
 */
export interface ModuleDefinition {
  /** Internal ID matching the ViewMode type. */
  id: ViewMode;
  /** Translation key for the module label. */
  labelKey: string; 
  /** Lucide icon component. */
  icon: any;
  /** Organizational group for sidebar and dashboard. */
  group: 'general' | 'ai_hub' | 'governance' | 'profile';
  /** Whether the module requires administrative privileges. */
  adminOnly?: boolean;
  /** Path for full-page route modules. If absent, the module renders as a dashboard tab. */
  path?: string; 
}

/**
 * DEFAULT_MODULES - The baseline set of scholarly tools.
 */
export const DEFAULT_MODULES: ModuleDefinition[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, group: 'general' },
  { id: 'chat', labelKey: 'nav.chat_hub', icon: MessageSquare, group: 'general' },
  { id: 'library', labelKey: 'nav.library', icon: Library, group: 'general' },
  { id: 'wiki', labelKey: 'nav.wiki', icon: GraduationCap, group: 'general', path: '/wiki' },
  
  { id: 'ai-assistant', labelKey: 'nav.study_assistant', icon: Sparkles, group: 'ai_hub' },
  { id: 'theology', labelKey: 'nav.theology_map', icon: History, group: 'ai_hub' },
  { id: 'manuscripts', labelKey: 'nav.manuscript_hub', icon: FileSearch2, group: 'ai_hub', path: '/manuscripts' },
  { id: 'lexicon', labelKey: 'nav.lexicon', icon: BookOpen, group: 'ai_hub' },
  { id: 'synthesis', labelKey: 'nav.synthesis', icon: Feather, group: 'ai_hub' },
  { id: 'boilerplate', labelKey: 'nav.boilerplate', icon: Puzzle, group: 'ai_hub' }
];

/**
 * Modules specific to administrative governance and access management.
 */
export const GOVERNANCE_MODULES: ModuleDefinition[] = [
  { id: 'profile', labelKey: 'nav.api_portal', icon: Key, group: 'governance', path: '/api-keys' },
  { id: 'dashboard', labelKey: 'nav.admin_api', icon: Key, group: 'governance', adminOnly: true, path: '/admin/api' },
  { id: 'dashboard', labelKey: 'nav.institutions', icon: School, group: 'governance', adminOnly: true, path: '/admin/institutions' },
  { id: 'dashboard', labelKey: 'nav.audit', icon: Activity, group: 'governance', adminOnly: true, path: '/admin/audit' },
  { id: 'dashboard', labelKey: 'nav.system_control', icon: Settings, group: 'governance', adminOnly: true, path: '/admin/settings' },
  { id: 'dashboard', labelKey: 'nav.module_governance', icon: Layers, group: 'governance', adminOnly: true, path: '/admin/modules' }
];
