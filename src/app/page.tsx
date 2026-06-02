
/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

'use client';

/**
 * @fileOverview Primary Research Dashboard Orchestrator.
 * Enhanced with Scholarly Dialogues and Audio Exegesis Hub.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  SAMLAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { doc, onSnapshot, getDocs, collection, query, orderBy, addDoc, limit, where, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { getGravatarUrl } from '@/lib/utils';
import { NotificationCenter } from '@/components/notification-center';
import { sanitizeHtml } from '@/lib/sanitization';
import { appConfig } from '@/app-config';

// UI Layout Components
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarInset, 
  SidebarFooter 
} from '@/components/ui/sidebar';
import { 
  Globe, 
  LogOut, 
  Moon, 
  Sun, 
  User,
  Loader2,
  Building2,
  ShieldCheck,
  Database
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Config & Types
import { ViewMode, UserProfile, AIProvider } from '@/types/scholarly';
import { DEFAULT_MODULES, GOVERNANCE_MODULES } from '@/config/modules';

// Modular View Components
import { DashboardView } from '@/components/views/dashboard-view';
import { ChatView } from '@/components/views/chat-view';
import { DirectMessageView } from '@/components/views/direct-message-view';
import { SynthesisView } from '@/components/views/synthesis-view';
import { TheologyView } from '@/components/views/theology-view';
import { LexiconView } from '@/components/views/lexicon-view';
import { AssistantView } from '@/components/views/assistant-view';
import { ProfileView } from '@/components/views/profile-view';
import { LibraryView } from '@/components/views/library-view';
import { ArchaeologyView } from '@/components/views/archaeology-view';
import { TimelineView } from '@/components/views/timeline-view';
import { TranslationCompareView } from '@/components/views/translation-compare-view';
import { VerseExplorerView } from '@/components/views/verse-explorer-view';
import { GeographyView } from '@/components/views/geography-view';
import { ArchiveView } from '@/components/views/archive-view';
import { CitationScannerView } from '@/components/views/citation-scanner-view';
import { SynopticView } from '@/components/views/synoptic-view';
import { LicensingHubView } from '@/components/views/licensing-hub-view';
import { CommentaryView } from '@/components/views/commentary-view';
import { ZoteroHubView } from '@/components/views/zotero-hub-view';
import { DebateView } from '@/components/views/debate-view';
import { AudioHubView } from '@/components/views/audio-hub-view';

// AI & API Imports
import { defineAndAnalyzeTerm } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { aiStudyAssistant } from '@/ai/flows/ai-study-assistant';
import { analyzeTheologicalConcept } from '@/ai/flows/theological-concept-analysis';
import { runArchaeologyAnalysis } from '@/ai/flows/archaeology-site-flow';
import { generateHistoricalTimeline } from '@/ai/flows/historical-timeline-flow';
import { compareTranslations } from '@/ai/flows/compare-translations-ai';
import { runGeographyAnalysis } from '@/ai/flows/geography-flow';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';
import { chunkText, selectRelevantChunks } from '@/lib/rag-engine';

export default function Home() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: userProfile } = useDoc<UserProfile>(userRef);
  
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);
  const [momentumData, setMomentumData] = useState<any[]>([]);
  
  const [aiPrefs, setAiPrefs] = useState({
    modelProvider: 'google' as AIProvider,
    selectedModel: 'googleai/gemini-2.5-flash',
    googleKey: '',
    openaiKey: '',
    anthropicKey: '',
    mistralKey: '',
    deepseekKey: '',
    xaiKey: '',
    ollamaUrl: 'http://localhost:11434',
    preferredBibleVersion: 'kjv',
    language: language,
    storagePreference: 'local' as 'cloud' | 'local'
  });

  const [chatMode, setChatMode] = useState<'global' | 'institutional'>('global');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatAgreed, setChatAgreed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [dmRecipient, setDmRecipient] = useState<any>(null);
  
  const [assistantTerm, setAssistantTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<any>(null);
  const [assistantResult, setAssistantResult] = useState<any>(null);
  const [theologyResult, setTheologyResult] = useState<any>(null);
  const [archaeologyResult, setArchaeologyResult] = useState<any>(null);
  const [geographyResult, setGeographyResult] = useState<any>(null);
  const [timelineResult, setTimelineResult] = useState<any>(null);

  const refreshLocalDocs = useCallback(async () => {
    const docs = await getAllLocalDocuments();
    setLocalDocuments(docs);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistoryItems(JSON.parse(savedHistory));
    
    refreshLocalDocs();
    getVersions().then(setAvailableVersions);

    if (!db) return;
    onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) setSystemConfig(snap.data());
    });

    return () => {};
  }, [db, refreshLocalDocs]);

  const handleLogin = async (providerType: 'google' | 'institutional' = 'google') => {
    setIsAuthLoading(true);
    try {
      let provider;
      if (providerType === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        const sso = systemConfig?.ssoConfig;
        if (!sso?.providerId) throw new Error("Institutional SSO not configured.");
        provider = sso.type === 'saml' ? new SAMLAuthProvider(sso.providerId) : new OAuthProvider(sso.providerId);
      }
      
      const result = await signInWithPopup(auth, provider);
      toast({ title: "Authenticated", description: `Welcome, ${result.user.displayName || 'Scholar'}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSearch = async (term: string, type: ViewMode) => {
    const sanitizedTerm = sanitizeHtml(term);
    if (!sanitizedTerm.trim()) return;

    let activeType = type;
    if (type === 'ai-assistant' && /^[GH]\d+$/i.test(sanitizedTerm)) {
      activeType = 'lexicon';
    }

    setIsLoading(true);
    setActiveTab(activeType);
    logSearch(db, sanitizedTerm, activeType, user?.uid);
    
    try {
      if (activeType === 'lexicon') {
        setLexiconResult(await defineAndAnalyzeTerm({ 
          strongsNumber: sanitizedTerm,
          model: aiPrefs.selectedModel,
          apiKey: aiPrefs.googleKey || undefined 
        }));
      }
      else if (activeType === 'ai-assistant') {
        const allChunks = localDocuments.flatMap(d => chunkText(d.content, d.name));
        const relevantChunks = selectRelevantChunks(sanitizedTerm, allChunks, 8);
        const contextExcerpts = relevantChunks.map(c => `[From Paper: ${c.sourceName}]: ${c.text}`);
        setAssistantResult(await aiStudyAssistant({ 
          term: sanitizedTerm, 
          researchContext: contextExcerpts,
          model: aiPrefs.selectedModel,
          apiKey: aiPrefs.googleKey || undefined
        }));
      }
      else if (activeType === 'theology') setTheologyResult(await analyzeTheologicalConcept({ concept: sanitizedTerm }));
      else if (activeType === 'archaeology') setArchaeologyResult(await runArchaeologyAnalysis({ query: sanitizedTerm }));
      else if (activeType === 'geography') setGeographyResult(await runGeographyAnalysis({ query: sanitizedTerm }));
      else if (activeType === 'timeline') setTimelineResult(await generateHistoricalTimeline({ topic: sanitizedTerm }));
    } catch (error: any) { 
      toast({ variant: 'destructive', title: 'Research Engine Error', description: error.message }); 
    }
    finally { setIsLoading(false); }
  };

  const renderModularContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView t={t} effectiveApiKey={aiPrefs.googleKey || systemConfig?.geminiApiKey} aiPrefs={aiPrefs} setAiPrefs={setAiPrefs} systemConfig={systemConfig} assistantTerm={assistantTerm} setAssistantTerm={setAssistantTerm} handleSearch={handleSearch} isLoading={isLoading} historyItems={historyItems} setActiveTab={setActiveTab} activeModules={DEFAULT_MODULES} momentumData={momentumData} />;
      case 'chat': return <ChatView chatMode={chatMode} setChatMode={setChatMode} userProfile={userProfile} userInstitutionName={""} messages={chatMessages} user={user} newMessage={newMessage} setNewMessage={setNewMessage} chatAgreed={chatAgreed} setChatAgreed={setChatAgreed} handleSendMessage={() => {}} chatEndRef={chatEndRef} onInitiateDM={(peer) => { setDmRecipient(peer); setActiveTab('direct-messages'); }} />;
      case 'direct-messages': return <DirectMessageView initialRecipient={dmRecipient} />;
      case 'library': return <LibraryView documents={localDocuments} onRefresh={refreshLocalDocs} isLoading={isLoading} />;
      case 'archive': return <ArchiveView onRestore={(type, data) => { 
        setActiveTab(type === 'assistant' ? 'ai-assistant' : type); 
        if(type === 'assistant' || type === 'ai-assistant') setAssistantResult(data);
        if(type === 'lexicon') setLexiconResult(data);
        if(type === 'theology') setTheologyResult(data);
      }} />;
      case 'zotero': return <ZoteroHubView />;
      case 'debate': return <DebateView />;
      case 'audio_hub': return <AudioHubView />;
      case 'synthesis': return <SynthesisView synthesisText={""} setSynthesisText={() => {}} handleSynthesisAction={() => {}} handleSaveDraftToLibrary={() => {}} handleExportText={() => {}} isLoading={isLoading} synthesisResult={null} integrityResult={null} bibResult={null} crossRefResult={null} />;
      case 'theology': return <TheologyView theologyTerm={""} setTheologyTerm={() => {}} handleSearch={handleSearch} isLoading={isLoading} theologyResult={theologyResult} />;
      case 'lexicon': return <LexiconView handleSearch={handleSearch} handleSaveSession={() => {}} handleExport={() => {}} isLoading={isLoading} lexiconResult={lexiconResult} isUserSignedIn={!!user} />;
      case 'synoptic': return <SynopticView />;
      case 'citation-scanner': return <CitationScannerView />;
      case 'verse-explorer': return <VerseExplorerView isLoading={isLoading} />;
      case 'geography': return <GeographyView isLoading={isLoading} result={geographyResult} onSearch={(term) => handleSearch(term, 'geography')} />;
      case 'archaeology': return <ArchaeologyView isLoading={isLoading} result={archaeologyResult} onSearch={(term) => handleSearch(term, 'archaeology')} />;
      case 'timeline': return <TimelineView isLoading={isLoading} result={timelineResult} onSearch={(term) => handleSearch(term, 'timeline')} />;
      case 'licensing-hub': return <LicensingHubView />;
      case 'commentaries': return <CommentaryView />;
      default: return <DashboardView t={t} effectiveApiKey={aiPrefs.googleKey || systemConfig?.geminiApiKey} aiPrefs={aiPrefs} setAiPrefs={setAiPrefs} systemConfig={systemConfig} assistantTerm={assistantTerm} setAssistantTerm={setAssistantTerm} handleSearch={handleSearch} isLoading={isLoading} historyItems={historyItems} setActiveTab={setActiveTab} activeModules={DEFAULT_MODULES} momentumData={momentumData} />;
    }
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                  <Globe className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold font-headline group-data-[state=collapsed]:hidden">{t.app_title}</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {user ? (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>General</SidebarGroupLabel>
                  <SidebarMenu>
                    {DEFAULT_MODULES.filter(m => m.group === 'general').map(m => (
                      <SidebarMenuItem key={m.id}>
                        <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)}>
                          <m.icon className="h-5 w-5" /> 
                          <span>{t.nav[m.id] || m.id}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup>
                  <SidebarGroupLabel>{t.nav.ai_hub}</SidebarGroupLabel>
                  <SidebarMenu>
                    {DEFAULT_MODULES.filter(m => m.group === 'ai_hub').map(m => (
                      <SidebarMenuItem key={m.id}>
                        <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)}>
                          <m.icon className="h-5 w-5" /> 
                          <span>{t.nav[m.id] || m.id}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
                {userProfile?.isAdmin && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Governance</SidebarGroupLabel>
                    <SidebarMenu>
                      {GOVERNANCE_MODULES.filter(m => m.adminOnly).map(m => (
                        <SidebarMenuItem key={m.id}>
                           <Link href={m.path || '#'}>
                            <SidebarMenuButton>
                              <m.icon className="h-5 w-5" /> 
                              <span>{t.nav[m.id] || m.id}</span>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                )}
              </>
            ) : (
              <div className="p-6 space-y-4">
                 <div className="flex flex-col items-center text-center gap-2 opacity-60">
                   <ShieldCheck className="h-10 w-10 text-primary" />
                   <p className="text-[10px] font-bold uppercase tracking-widest">Authentication Required</p>
                 </div>
                 <Button className="w-full text-xs h-11" onClick={() => handleLogin('google')} disabled={isAuthLoading}>
                   {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                   {t.nav.login_google}
                 </Button>
                 {systemConfig?.ssoConfig?.enabled && (
                   <Button variant="outline" className="w-full text-xs h-11 border-primary/20" onClick={() => handleLogin('institutional')} disabled={isAuthLoading}>
                     <Building2 className="h-4 w-4 mr-2 text-primary" />
                     {systemConfig.ssoConfig.label}
                   </Button>
                 )}
              </div>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
             {user && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="h-12">
                       <Avatar className="h-6 w-6 border">
                          <AvatarImage src={user.photoURL || getGravatarUrl(user.email || '')} />
                          <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                       </Avatar>
                       <span className="truncate">{user.displayName}</span>
                    </SidebarMenuButton>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                       <User className="h-4 w-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut(auth)}>
                       <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}
             <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="mt-2">
               {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 bg-background/80 backdrop-blur-md px-4 border-b">
             <div className="flex items-center gap-4 w-full">
                <NotificationCenter />
                <div className="h-4 w-[1px] bg-border mx-2" />
                <div className="flex-1 flex items-center gap-2">
                   <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-tighter">Scholarly Beta</Badge>
                </div>
             </div>
          </header>
          <main className="container max-w-5xl mx-auto py-10 px-6 min-h-screen" id="main-content">
            {renderModularContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
