/**
 * @fileOverview Shared types and constants for the LexiVerse scholarly environment.
 */

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
  | 'boilerplate'; // Added for module development assistance

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
    modelProvider?: 'google' | 'local';
    selectedModel?: string;
    customApiKey?: string;
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
