
/**
 * LexiVerse Explorer
 * Copyright (c) 2024. Licensed under CC BY-NC-SA 4.0.
 * 
 * @fileOverview Declarative Module Registry for LexiVerse Explorer.
 */

import { 
  LayoutDashboard, 
  MessageSquare, 
  MessageCircle,
  GraduationCap, 
  Sparkles, 
  History, 
  FileSearch, 
  BookOpen, 
  Feather, 
  Map as MapIcon,
  Key,
  School,
  Settings,
  Layers,
  Activity,
  Library,
  ArrowLeftRight,
  Clock,
  NotebookPen,
  Globe,
  UserCheck,
  Archive,
  ListFilter,
  ShieldCheck,
  Database,
  Users,
  Volume2
} from 'lucide-react';
import { ViewMode } from '@/types/scholarly';

export interface ModuleDefinition {
  id: ViewMode | 'synoptic' | 'citation-scanner' | 'licensing-hub' | 'commentaries' | 'zotero' | 'debate' | 'audio_hub';
  labelKey: string; 
  icon: any;
  group: 'general' | 'workspace' | 'linguistics' | 'exegesis' | 'history' | 'governance' | 'profile';
  adminOnly?: boolean;
  path?: string; 
}

export const DEFAULT_MODULES: ModuleDefinition[] = [
  // General Category
  { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, group: 'general' },
  { id: 'chat', labelKey: 'nav.chat_hub', icon: MessageSquare, group: 'general' },
  { id: 'direct-messages', labelKey: 'nav.direct_messages', icon: MessageCircle, group: 'general' },
  { id: 'wiki', labelKey: 'nav.wiki', icon: GraduationCap, group: 'general', path: '/wiki' },
  
  // Workspace Category
  { id: 'archive', labelKey: 'nav.archive', icon: Archive, group: 'workspace' },
  { id: 'library', labelKey: 'nav.library', icon: Library, group: 'workspace' },
  { id: 'zotero', labelKey: 'nav.zotero_hub', icon: Database, group: 'workspace' },
  { id: 'licensing-hub', labelKey: 'nav.licensing_hub', icon: ShieldCheck, group: 'workspace' },

  // Linguistics Category
  { id: 'lexicon', labelKey: 'nav.lexicon', icon: BookOpen, group: 'linguistics' },
  { id: 'manuscripts', labelKey: 'nav.manuscript_hub', icon: FileSearch, group: 'linguistics', path: '/manuscripts' },
  { id: 'translation-compare', labelKey: 'nav.translation_compare', icon: ArrowLeftRight, group: 'linguistics' },

  // Exegesis Category
  { id: 'ai-assistant', labelKey: 'nav.study_assistant', icon: Sparkles, group: 'exegesis' },
  { id: 'verse-explorer', labelKey: 'nav.verse_explorer', icon: NotebookPen, group: 'exegesis' },
  { id: 'commentaries', labelKey: 'nav.commentaries', icon: BookOpen, group: 'exegesis' },
  { id: 'synoptic', labelKey: 'nav.synoptic', icon: Layers, group: 'exegesis' },
  { id: 'synthesis', labelKey: 'nav.synthesis', icon: Feather, group: 'exegesis' },
  { id: 'citation-scanner', labelKey: 'nav.citation_scanner', icon: ListFilter, group: 'exegesis' },
  { id: 'audio_hub', labelKey: 'nav.audio_hub', icon: Volume2, group: 'exegesis' },

  // History Category
  { id: 'theology', labelKey: 'nav.theology_map', icon: History, group: 'history' },
  { id: 'timeline', labelKey: 'nav.timeline', icon: Clock, group: 'history' },
  { id: 'archaeology', labelKey: 'nav.archaeology', icon: MapIcon, group: 'history' },
  { id: 'geography', labelKey: 'nav.geography', icon: Globe, group: 'history' },
  { id: 'debate', labelKey: 'nav.debate', icon: Users, group: 'history' }
];

export const GOVERNANCE_MODULES: ModuleDefinition[] = [
  { id: 'profile', labelKey: 'nav.api_portal', icon: Key, group: 'governance', path: '/api-keys' },
  { id: 'wiki-moderation', labelKey: 'nav.wiki_moderation', icon: UserCheck, group: 'governance', adminOnly: true, path: '/admin/wiki' },
  { id: 'admin-api', labelKey: 'nav.admin_api', icon: Key, group: 'governance', adminOnly: true, path: '/admin/api' },
  { id: 'institutions', labelKey: 'nav.institutions', icon: School, group: 'governance', adminOnly: true, path: '/admin/institutions' },
  { id: 'audit', labelKey: 'nav.audit', icon: Activity, group: 'governance', adminOnly: true, path: '/admin/audit' },
  { id: 'system-control', labelKey: 'nav.system_control', icon: Settings, group: 'governance', adminOnly: true, path: '/admin/settings' },
  { id: 'module-governance', labelKey: 'nav.module_governance', icon: Layers, group: 'governance', adminOnly: true, path: '/admin/modules' }
];
