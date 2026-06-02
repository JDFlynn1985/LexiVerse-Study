
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
  | 'timeline'
  | 'geography'
  | 'wiki-moderation';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  credentials?: string;
  denomination?: string;
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

export const DENOMINATIONS = [
  'Roman Catholic',
  'Eastern Orthodox',
  'Oriental Orthodox',
  'Anglican / Episcopal',
  'Lutheran',
  'Presbyterian / Reformed',
  'Baptist',
  'Methodist',
  'Pentecostal',
  'Charismatic',
  'Seventh-day Adventist',
  'Church of Christ',
  'Disciples of Christ',
  'Mennonite',
  'Quaker (Religious Society of Friends)',
  'Nondenominational / Independent',
  'Assemblies of God',
  'Church of God',
  'Calvary Chapel',
  'Vineyard',
  'Messianic Judaism',
  'Evangelical Free',
  'Salvation Army',
  'United Church of Christ',
  'Congregational',
  'Moravian',
  'Other Christian Tradition'
] as const;
