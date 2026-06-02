/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

'use client';

/**
 * @fileOverview Primary Research Dashboard Orchestrator.
 * Updated with Advanced RAG chunking logic and mid-session AI model switching.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, onSnapshot, getDocs, collection, query, orderBy, addDoc, limit, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { getGravatarUrl } from '@/lib/utils';
import { getIconByName } from '@/lib/icons';

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
  Loader2
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

// Config & Types
import { ViewMode, UserProfile } from '@/types/scholarly';
import { DEFAULT_MODULES, GOVERNANCE_MODULES } from '@/config/modules';

// Modular View Components
import { DashboardView } from '@/components/views/dashboard-view';
import { ChatView } from '@/components/views/chat-view';
import { SynthesisView } from '@/components/views/synthesis-view';
import { TheologyView } from '@/components/views/theology-view';
import { LexiconView } from '@/components/views/lexicon-view';
import { AssistantView } from '@/components/views/assistant-view';
import { ProfileView } from '@/components/views/profile-view';
import { LibraryView } from '@/components/views/library-view';
import { BoilerplateView } from '@/components/views/boilerplate-view';
import { TranslationCompareView } from '@/components/views/translation-compare-view';

// AI & API Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { refineWriting, type WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { checkIntegrity, type AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { formatBibliography, type FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { runBoilerplateAnalysis, type BoilerplateOutput } from '@/ai/flows/boilerplate-flow';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';
import { chunkText, selectRelevantChunks } from '@/lib/rag-engine';

/**
 * Main Home component orchestrating the scholarly workspace.
 */
export default function Home() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: userProfile } = useDoc<UserProfile>(userRef);
  
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);
  const [institutions, setInstitutions] = useState<{id: string, name: string}[]>([]);
  const [localApiKey, setLocalApiKey] = useState<string>('');
  const [dynamicModules, setDynamicModules] = useState<any[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  
  const [aiPrefs, setAiPrefs] = useState({
    modelProvider: 'google' as 'google' | 'local',
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language,
    storagePreference: 'local' as 'cloud' | 'local'
  });

  // Module States
  const [chatMode, setChatMode] = useState<'global' | 'institutional'>('global');
  const [newMessage, setNewMessage] = useState('');
  const [chatAgreed, setChatAgreed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [assistantTerm, setAssistantTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
  const [boilerplateResult, setBoilerplateResult] = useState<BoilerplateOutput | null>(null);
  const [translationResult, setTranslationResult] = useState<CompareTranslationsOutput | null>(null);
  const [profileDraft, setProfileDraft] = useState({ displayName: '', credentials: '', designation: '', degreeSubject: '', academicLevel: '', institutionId: '', bio: '', photoURL: '' });
  const [synthesisText, setSynthesisText] = useState('');
  const [synthesisResult, setSynthesisResult] = useState<WritingAssistantOutput | null>(null);
  const [integrityResult, setIntegrityResult] = useState<AcademicIntegrityOutput | null>(null);
  const [bibResult, setBibResult] = useState<FormatBibliographyOutput | null>(null);
  const [theologyTerm, setTheologyTerm] = useState('');
  const [theologyResult, setTheologyResult] = useState<TheologicalConceptOutput | null>(null);

  const refreshLocalDocs = useCallback(async () => {
    const docs = await getAllLocalDocuments();
    setLocalDocuments(docs);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistoryItems(JSON.parse(savedHistory));
    const savedLocalKey = localStorage.getItem('lexiverse_local_api_key');
    if (savedLocalKey) setLocalApiKey(savedLocalKey);
    refreshLocalDocs();
    getVersions().then(setAvailableVersions);

    async function fetchInstitutions() {
      if (!db) return;
      try {
        const snap = await getDocs(query(collection(db, 'institutions'), orderBy('name', 'asc')));
        setInstitutions(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (e) { console.error("Institution fetch failed"); }
    }
    fetchInstitutions();

    if (!db) return;
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSystemConfig(data);
      }
    });

    const unsubModules = onSnapshot(collection(db, 'modules'), (snap) => {
      const mods = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      setDynamicModules(mods);
      setModulesLoading(false);
    });

    return () => {
      unsubConfig();
      unsubModules();
    };
  }, [db, refreshLocalDocs]);

  useEffect(() => {
    if (userProfile) {
      const prefs = userProfile.preferences || {};
      setAiPrefs(prev => ({
        ...prev,
        ...prefs,
        modelProvider: prefs.modelProvider || 'google',
        selectedModel: prefs.selectedModel || 'googleai/gemini-2.5-flash'
      }));
      setProfileDraft({
        displayName: userProfile.displayName || '',
        credentials: userProfile.credentials || '',
        designation: userProfile.designation || '',
        degreeSubject: userProfile.degreeSubject || '',
        academicLevel: userProfile.academicLevel || '',
        institutionId: userProfile.institutionId || '',
        bio: userProfile.bio || '',
        photoURL: userProfile.photoURL || ''
      });
    }
  }, [userProfile]);

  const chatQuery = useMemoFirebase(() => {
    if (!db) return null;
    const base = collection(db, 'messages');
    if (chatMode === 'global') return query(base, where('type', '==', 'global'), orderBy('createdAt', 'desc'), limit(50));
    const instId = userProfile?.institutionId || 'independent';
    return query(base, where('type', '==', 'institutional'), where('institutionId', '==', instId), orderBy('createdAt', 'desc'), limit(50));
  }, [db, chatMode, userProfile?.institutionId]);

  const { data: messages } = useCollection<any>(chatQuery);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !db || !chatAgreed) return;
    const msgContent = newMessage;
    setNewMessage('');
    try {
      const userInstName = institutions.find(i => i.id === userProfile?.institutionId)?.name || 'Independent Scholar';
      await addDoc(collection(db, 'messages'), {
        content: msgContent,
        senderUid: user.uid,
        senderName: userProfile?.displayName || user.displayName,
        senderPhotoURL: userProfile?.photoURL || user.photoURL || '',
        senderDesignation: userProfile?.designation || 'Scholar',
        senderInstitutionName: userInstName,
        type: chatMode,
        institutionId: chatMode === 'institutional' ? (userProfile?.institutionId || 'independent') : null,
        createdAt: serverTimestamp(),
        license: 'CC-BY-4.0'
      });
    } catch (e: any) { toast({ variant: 'destructive', title: "Message Failed", description: e.message }); }
  };

  const effectiveApiKey = localApiKey || aiPrefs.customApiKey || systemConfig?.geminiApiKey;
  const isLocalMode = aiPrefs.modelProvider === 'local';
  const effectiveModel = isLocalMode ? aiPrefs.selectedModel : (aiPrefs.selectedModel?.includes('/') ? aiPrefs.selectedModel : `googleai/${aiPrefs.selectedModel}`);

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    if (type !== 'chat' && !effectiveApiKey && !isLocalMode) {
      toast({ variant: "destructive", title: "AI Hub Configuration Required", description: "Please supply your own Gemini API key in your profile settings." });
      return;
    }
    setIsLoading(true);
    setActiveTab(type);
    if (type !== 'chat') logSearch(db, term, type, user?.uid);
    try {
      if (type === 'lexicon') setLexiconResult(await defineAndAnalyzeTerm({ strongsNumber: term, model: effectiveModel, apiKey: effectiveApiKey || undefined }));
      else if (type === 'ai-assistant') {
        // Advanced RAG Selection Logic
        const allChunks = localDocuments.flatMap(d => chunkText(d.content, d.name));
        const relevantChunks = selectRelevantChunks(term, allChunks, 8);
        const contextExcerpts = relevantChunks.map(c => `[From Paper: ${c.sourceName}]: ${c.text}`);

        setAssistantResult(await aiStudyAssistant({ 
          term, 
          researchContext: contextExcerpts, 
          model: effectiveModel, 
          apiKey: effectiveApiKey || undefined 
        }));
      }
      else if (type === 'theology') setTheologyResult(await analyzeTheologicalConcept({ concept: term }));
      else if (type === 'boilerplate') setBoilerplateResult(await runBoilerplateAnalysis({ query: term }));
      
      if (type !== 'chat') {
        const newHistory = [{id: Date.now().toString(), type, term, date: new Date().toLocaleString()}, ...historyItems];
        setHistoryItems(newHistory.slice(0, 10));
        localStorage.setItem('lexiverse_history', JSON.stringify(newHistory.slice(0, 10)));
      }
    } catch (error: any) { toast({ variant: 'destructive', title: 'Research Engine Error', description: error.message }); }
    finally { setIsLoading(false); }
  };

  const updateProfile = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { ...profileDraft });
      toast({ title: "Profile Updated" });
    } catch (e) { toast({ variant: 'destructive', title: "Failed to update profile" }); }
    finally { setIsLoading(false); }
  };

  const saveAiPreferences = async (newPrefs: any) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { preferences: { ...userProfile?.preferences, ...newPrefs } });
      setAiPrefs(prev => ({...prev, ...newPrefs}));
      toast({ title: "Preferences Saved" });
    } catch (e) { toast({ variant: 'destructive', title: "Failed to save preferences" }); }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      toast({ title: "Welcome", description: result.user.displayName });
    } catch (error: any) { toast({ variant: "destructive", title: "Login Failed" }); }
  };

  if (!mounted) return null;
  const effectiveAvatar = userProfile?.photoURL || (user?.email ? getGravatarUrl(user.email) : '');
  const userInstitutionName = institutions.find(i => i.id === userProfile?.institutionId)?.name || 'Independent Scholar';

  const getTranslatedLabel = (key: string) => {
    const parts = key.split('.');
    let res = t;
    for (const p of parts) res = res?.[p];
    return res || key;
  };

  const getActiveModules = (group: string) => {
    const staticGroup = [...DEFAULT_MODULES, ...GOVERNANCE_MODULES].filter(m => m.group === group);
    if (modulesLoading) return staticGroup;
    return staticGroup.filter(m => {
      const dynamic = dynamicModules.find(dm => dm.id === m.id);
      if (dynamic) return dynamic.enabled === true;
      return true;
    });
  };

  const activeModulesList = [...getActiveModules('general'), ...getActiveModules('ai_hub'), ...getActiveModules('governance')];

  const renderModularContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView t={t} effectiveApiKey={effectiveApiKey} isLocalMode={isLocalMode} aiPrefs={aiPrefs} setAiPrefs={setAiPrefs} systemConfig={systemConfig} assistantTerm={assistantTerm} setAssistantTerm={setAssistantTerm} handleSearch={handleSearch} isLoading={isLoading} historyItems={historyItems} setActiveTab={setActiveTab} activeModules={activeModulesList} />;
      case 'chat': return <ChatView chatMode={chatMode} setChatMode={setChatMode} userProfile={userProfile} userInstitutionName={userInstitutionName} messages={messages} user={user} newMessage={newMessage} setNewMessage={setNewMessage} chatAgreed={chatAgreed} setChatAgreed={setChatAgreed} handleSendMessage={handleSendMessage} chatEndRef={chatEndRef} />;
      case 'library': return <LibraryView documents={localDocuments} onRefresh={refreshLocalDocs} isLoading={isLoading} />;
      case 'synthesis': return <SynthesisView synthesisText={synthesisText} setSynthesisText={setSynthesisText} handleSynthesisAction={async (a) => {
        setIsLoading(true);
        try {
          if (a === 'refine') setSynthesisResult(await refineWriting({ text: synthesisText, mode: 'academic' }));
          if (a === 'integrity') setIntegrityResult(await checkIntegrity({ text: synthesisText, style: 'SBL' }));
          if (a === 'bib') setBibResult(await formatBibliography({ items: synthesisText.split('\n'), style: 'SBL' }));
        } catch (e: any) { toast({ variant: 'destructive', title: "Synthesis Error" }); }
        finally { setIsLoading(false); }
      }} isLoading={isLoading} synthesisResult={synthesisResult} integrityResult={integrityResult} bibResult={bibResult} />;
      case 'theology': return <TheologyView theologyTerm={theologyTerm} setTheologyTerm={setTheologyTerm} handleSearch={handleSearch} isLoading={isLoading} theologyResult={theologyResult} />;
      case 'lexicon': return <LexiconView handleSearch={handleSearch} isLoading={isLoading} lexiconResult={lexiconResult} />;
      case 'ai-assistant': return <AssistantView assistantTerm={assistantTerm} setAssistantTerm={setAssistantTerm} handleSearch={handleSearch} isLoading={isLoading} assistantResult={assistantResult} />;
      case 'translation-compare': return <TranslationCompareView isLoading={isLoading} result={translationResult} availableVersions={availableVersions} onCompare={async (w, l, v) => {
        setIsLoading(true);
        try { setTranslationResult(await compareTranslations({ word: w, language: l, versions: v })); }
        catch (e: any) { toast({ variant: 'destructive', title: "Comparison Error" }); }
        finally { setIsLoading(false); }
      }} />;
      case 'boilerplate': return <BoilerplateView isLoading={isLoading} result={boilerplateResult} onSearch={(term) => handleSearch(term, 'boilerplate')} />;
      case 'profile': return userProfile ? <ProfileView userProfile={userProfile} effectiveAvatar={effectiveAvatar} userInstitutionName={userInstitutionName} profileDraft={profileDraft} setProfileDraft={setProfileDraft} institutions={institutions} updateProfile={updateProfile} isLoading={isLoading} aiPrefs={aiPrefs} saveAiPreferences={saveAiPreferences} systemConfig={systemConfig} historyItems={historyItems} handleSearch={handleSearch} /> : null;
      default: return <DashboardView t={t} effectiveApiKey={effectiveApiKey} isLocalMode={isLocalMode} aiPrefs={aiPrefs} setAiPrefs={setAiPrefs} systemConfig={systemConfig} assistantTerm={assistantTerm} setAssistantTerm={setAssistantTerm} handleSearch={handleSearch} isLoading={isLoading} historyItems={historyItems} setActiveTab={setActiveTab} activeModules={activeModulesList} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md">
                <Globe className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">{t.app_title}</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
              <SidebarMenu>
                {getActiveModules('general').map(m => (
                  <SidebarMenuItem key={m.id}>
                    {m.path ? (
                      <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                        <Link href={m.path}>
                          <m.icon className="h-5 w-5" /> 
                          <span>{getTranslatedLabel(m.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                        <m.icon className="h-5 w-5" /> 
                        <span>{getTranslatedLabel(m.labelKey)}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.ai_hub}</SidebarGroupLabel>
              <SidebarMenu>
                {getActiveModules('ai_hub').map(m => (
                  <SidebarMenuItem key={m.id}>
                    {m.path ? (
                      <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                        <Link href={m.path}>
                          <m.icon className="h-5 w-5" /> 
                          <span>{getTranslatedLabel(m.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                        <m.icon className="h-5 w-5" /> 
                        <span>{getTranslatedLabel(m.labelKey)}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Governance</SidebarGroupLabel>
              <SidebarMenu>
                {getActiveModules('governance').map((m, idx) => {
                  if (m.adminOnly && !userProfile?.isAdmin) return null;
                  return (
                    <SidebarMenuItem key={idx}>
                      {m.path ? (
                        <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                          <Link href={m.path}>
                            <m.icon className="h-5 w-5" /> 
                            <span>{getTranslatedLabel(m.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                          <m.icon className="h-5 w-5" /> 
                          <span>{getTranslatedLabel(m.labelKey)}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-1">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full border">
                        <Avatar className="h-full w-full">
                          <AvatarImage src={effectiveAvatar} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span>{userProfile?.displayName || user.displayName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal truncate">{userInstitutionName}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setActiveTab('profile')}><User className="h-4 w-4 mr-2" /> My Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogin}>Login</Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            {modulesLoading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground italic">Synchronizing Scholarly Workspace...</p>
              </div>
            ) : renderModularContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
