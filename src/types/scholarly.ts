
/**
 * @fileOverview Shared types and constants for the LexiVerse scholarly environment.
 */

export type AIProvider = 'google' | 'local' | 'openai' | 'anthropic' | 'mistral' | 'deepseek' | 'xai';

export type ViewMode = 
  | 'dashboard' 
  | 'lexicon' 
  | 'wiki' 
  | 'ai-assistant' 
  | 'profile' 
  | 'synthesis' 
  | 'theology' 
  | 'manuscripts' 
  | 'chat'
  | 'library'
  | 'translation-compare'
  | 'archaeology'
  | 'timeline';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  credentials?: string;
  designation?: string;
  degreeSubject?: string;
  academicLevel?: string;
  institutionId?: string;
  bio?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isTrustedContributor?: boolean;
  preferences?: {
    modelProvider?: AIProvider;
    selectedModel?: string;
    googleKey?: string;
    openaiKey?: string;
    anthropicKey?: string;
    mistralKey?: string;
    deepseekKey?: string;
    xaiKey?: string;
    ollamaUrl?: string;
    preferredBibleVersion?: string;
    language?: string;
    storagePreference?: 'cloud' | 'local';
  };
}

export const DESIGNATIONS = [
  'Professor',
  'Undergraduate Seminary Student',
  'Master\'s Degree Candidate',
  'Doctoral Candidate',
  'Non-Seminary Student'
] as const;
