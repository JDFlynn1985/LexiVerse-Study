
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc, updateDoc, collection, getDocs, query, orderBy, addDoc, limit, where, serverTimestamp } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { getGravatarUrl } from '@/lib/utils';

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
  ChevronRight
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
import { SCHOLARLY_MODULES, GOVERNANCE_MODULES } from '@/config/modules';

// Modular View Components
import { DashboardView } from '@/components/views/dashboard-view';
import { ChatView } from '@/components/views/chat-view';
import { SynthesisView } from '@/components/views/synthesis-view';
import { TheologyView } from '@/components/views/theology-view';
import { LexiconView } from '@/components/views/lexicon-view';
import { AssistantView } from '@/components/views/assistant-view';
import { ProfileView } from '@/components/views/profile-view';
import { BoilerplateView } from '@/components/views/boilerplate-view';

// AI & API Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { refineWriting, type WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { checkIntegrity, type AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { formatBibliography, type FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { runBoilerplateAnalysis, type BoilerplateOutput } from '@/ai/flows/boilerplate-flow';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

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
  
  const [aiPrefs, setAiPrefs] = useState({
    modelProvider: 'google' as 'google' | 'local',
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language,
    storagePreference: 'local' as 'cloud' | 'local'
  });

  // Section-specific State
  const [chatMode, setChatMode] = useState<'global' | 'institutional'>('global');
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [assistantTerm, setAssistantTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
  const [boilerplateResult, setBoilerplateResult] = useState<BoilerplateOutput | null>(null);
  
  const [profileDraft, setProfileDraft] = useState({ 
    displayName: '', 
    credentials: '', 
    designation: '', 
    degreeSubject: '', 
    academicLevel: '', 
    institutionId: '',
    bio: '', 
    photoURL: '' 
  });

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
      } catch (e) {
        console.error("Institution fetch failed");
      }
    }
    fetchInstitutions();

    if (!db) return;
    const unsubConfig = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSystemConfig(data);
        if (!userProfile?.preferences) {
          setAiPrefs(prev => ({
            ...prev,
            modelProvider: data.defaultModelProvider || 'google',
            selectedModel: data.defaultModel || 'googleai/gemini-2.5-flash'
          }));
        }
      }
    });
    return () => unsubConfig();
  }, [db, refreshLocalDocs, userProfile?.preferences]);

  useEffect(() => {
    if (userProfile) {
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
      if (userProfile.preferences) {
        setAiPrefs(prev => ({
          ...prev,
          ...userProfile.preferences,
          language: userProfile.preferences?.language || language
        }));
      }
    }
  }, [userProfile, language]);

  const chatQuery = useMemoFirebase(() => {
    if (!db) return null;
    const base = collection(db, 'messages');
    if (chatMode === 'global') {
      return query(base, where('type', '==', 'global'), orderBy('createdAt', 'desc'), limit(50));
    } else {
      const instId = userProfile?.institutionId || 'independent';
      return query(base, where('type', '==', 'institutional'), where('institutionId', '==', instId), orderBy('createdAt', 'desc'), limit(50));
    }
  }, [db, chatMode, userProfile?.institutionId]);

  const { data: messages } = useCollection<any>(chatQuery);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !db) return;

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
        createdAt: serverTimestamp()
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Message Failed", description: e.message });
    }
  };

  const effectiveApiKey = localApiKey || aiPrefs.customApiKey || systemConfig?.geminiApiKey;
  const isLocalMode = aiPrefs.modelProvider === 'local';
  const effectiveModel = isLocalMode 
    ? aiPrefs.selectedModel 
    : (aiPrefs.selectedModel?.includes('/') ? aiPrefs.selectedModel : `googleai/${aiPrefs.selectedModel}`);

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    if (type !== 'chat' && !effectiveApiKey && !isLocalMode) {
      toast({ variant: "destructive", title: "AI Hub Configuration Required", description: "Please supply your own Gemini API key or switch to a local engine in settings." });
      return;
    }
    setIsLoading(true);
    setActiveTab(type);
    if (type !== 'chat') logSearch(db, term, type, user?.uid);
    try {
      if (type === 'lexicon') {
        const result = await defineAndAnalyzeTerm({ strongsNumber: term, model: effectiveModel, apiKey: effectiveApiKey || undefined });
        setLexiconResult(result);
      } else if (type === 'ai-assistant') {
        const researchContext = localDocuments.map(d => d.content);
        const result = await aiStudyAssistant({ term, researchContext, model: effectiveModel, apiKey: effectiveApiKey || undefined });
        setAssistantResult(result);
      } else if (type === 'theology') {
        const result = await analyzeTheologicalConcept({ concept: term });
        setTheologyResult(result);
      } else if (type === 'boilerplate') {
        const result = await runBoilerplateAnalysis({ query: term });
        setBoilerplateResult(result);
      }
      if (type !== 'chat') {
        const newHistory = [{id: Date.now().toString(), type, term, date: new Date().toLocaleString()}, ...historyItems];
        setHistoryItems(newHistory.slice(0, 10));
        localStorage.setItem('lexiverse_history', JSON.stringify(newHistory.slice(0, 10)));
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Research Engine Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesisAction = async (action: 'refine' | 'integrity' | 'bib') => {
    if (!synthesisText.trim()) return;
    setIsLoading(true);
    try {
      if (action === 'refine') {
        const res = await refineWriting({ text: synthesisText, mode: 'academic' });
        setSynthesisResult(res);
      } else if (action === 'integrity') {
        const res = await checkIntegrity({ text: synthesisText, style: 'SBL' });
        setIntegrityResult(res);
      } else if (action === 'bib') {
        const res = await formatBibliography({ items: synthesisText.split('\n'), style: 'SBL' });
        setBibResult(res);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Synthesis Hub Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileDraft.displayName,
        credentials: profileDraft.credentials,
        designation: profileDraft.designation || null,
        degreeSubject: profileDraft.degreeSubject,
        academicLevel: profileDraft.academicLevel,
        institutionId: profileDraft.institutionId || null,
        bio: profileDraft.bio,
        photoURL: profileDraft.photoURL
      });
      toast({ title: "Profile Updated", description: "Identity updated successfully." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAiPreferences = async (newPrefs: any) => {
    if (!user || !db) return;
    try {
      const storageMode = newPrefs.storagePreference || aiPrefs.storagePreference;
      if (storageMode === 'local') {
        if (newPrefs.customApiKey !== undefined) {
          localStorage.setItem('lexiverse_local_api_key', newPrefs.customApiKey);
          setLocalApiKey(newPrefs.customApiKey);
          newPrefs.customApiKey = ""; 
        }
      } else if (storageMode === 'cloud') {
        localStorage.removeItem('lexiverse_local_api_key');
        setLocalApiKey('');
      }
      await updateDoc(doc(db, 'users', user.uid), { preferences: { ...userProfile?.preferences, ...newPrefs } });
      setAiPrefs(prev => ({...prev, ...newPrefs}));
      toast({ title: "Preferences Saved", description: "Scholarly configuration refreshed." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to save preferences" });
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { 
          uid: result.user.uid, displayName: result.user.displayName, email: result.user.email, photoURL: '',
          isAdmin: false, isModerator: false, isTrustedContributor: false,
          preferences: {
            modelProvider: systemConfig?.defaultModelProvider || 'google',
            selectedModel: systemConfig?.defaultModel || 'googleai/gemini-2.5-flash',
            customApiKey: '', storagePreference: 'local' 
          }
        });
      }
      toast({ title: "Scholarly Access Granted", description: `Welcome, ${result.user.displayName}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  if (!mounted) return null;
  const effectiveAvatar = userProfile?.photoURL || (user?.email ? getGravatarUrl(user.email) : '');
  const userInstitutionName = institutions.find(i => i.id === userProfile?.institutionId)?.name || 'Independent Scholar';

  const getTranslatedLabel = (key: string) => {
    const parts = key.split('.');
    let result = t;
    for (const part of parts) {
      result = result?.[part];
    }
    return result || key;
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
                {SCHOLARLY_MODULES.filter(m => m.group === 'general').map(m => (
                  <SidebarMenuItem key={m.id}>
                    {m.path ? (
                      <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                        <Link href={m.path}>
                          <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                        <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.ai_hub}</SidebarGroupLabel>
              <SidebarMenu>
                {SCHOLARLY_MODULES.filter(m => m.group === 'ai_hub').map(m => (
                  <SidebarMenuItem key={m.id}>
                    {m.path ? (
                      <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                        <Link href={m.path}>
                          <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                        <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Governance</SidebarGroupLabel>
              <SidebarMenu>
                {GOVERNANCE_MODULES.map((m, idx) => {
                  if (m.adminOnly && !userProfile?.isAdmin) return null;
                  return (
                    <SidebarMenuItem key={idx}>
                      {m.path ? (
                        <SidebarMenuButton asChild tooltip={getTranslatedLabel(m.labelKey)}>
                          <Link href={m.path}>
                            <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton isActive={activeTab === m.id} onClick={() => setActiveTab(m.id)} tooltip={getTranslatedLabel(m.labelKey)}>
                          <m.icon className="h-5 w-5" /> <span>{getTranslatedLabel(m.labelKey)}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            {systemConfig?.networkMode === 'local-only' && (
              <div className="mb-4 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <Globe className="h-3 w-3 text-green-700 dark:text-green-400" />
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase group-data-[collapsible=icon]:hidden">Local Network</span>
              </div>
            )}
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-1">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
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
                      <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                        <User className="h-4 w-4 mr-2" /> My Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut(auth)} className="text-destructive">
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogin}>Login</Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            {activeTab === 'dashboard' && (
              <DashboardView 
                t={t} 
                effectiveApiKey={effectiveApiKey} 
                isLocalMode={isLocalMode} 
                aiPrefs={aiPrefs} 
                assistantTerm={assistantTerm} 
                setAssistantTerm={setAssistantTerm} 
                handleSearch={handleSearch} 
                isLoading={isLoading} 
                historyItems={historyItems} 
                setActiveTab={setActiveTab} 
              />
            )}

            {activeTab === 'chat' && (
              <ChatView 
                chatMode={chatMode} 
                setChatMode={setChatMode} 
                userProfile={userProfile} 
                userInstitutionName={userInstitutionName} 
                messages={messages} 
                user={user} 
                newMessage={newMessage} 
                setNewMessage={setNewMessage} 
                handleSendMessage={handleSendMessage} 
                chatEndRef={chatEndRef} 
              />
            )}

            {activeTab === 'synthesis' && (
              <SynthesisView 
                synthesisText={synthesisText} 
                setSynthesisText={setSynthesisText} 
                handleSynthesisAction={handleSynthesisAction} 
                isLoading={isLoading} 
                synthesisResult={synthesisResult} 
                integrityResult={integrityResult} 
                bibResult={bibResult} 
              />
            )}

            {activeTab === 'theology' && (
              <TheologyView 
                theologyTerm={theologyTerm} 
                setTheologyTerm={setTheologyTerm} 
                handleSearch={handleSearch} 
                isLoading={isLoading} 
                theologyResult={theologyResult} 
              />
            )}

            {activeTab === 'lexicon' && (
              <LexiconView 
                handleSearch={handleSearch} 
                isLoading={isLoading} 
                lexiconResult={lexiconResult} 
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AssistantView 
                assistantTerm={assistantTerm} 
                setAssistantTerm={setAssistantTerm} 
                handleSearch={handleSearch} 
                isLoading={isLoading} 
                assistantResult={assistantResult} 
              />
            )}

            {activeTab === 'boilerplate' && (
              <BoilerplateView 
                isLoading={isLoading}
                result={boilerplateResult}
                onSearch={(term) => handleSearch(term, 'boilerplate')}
              />
            )}

            {activeTab === 'profile' && userProfile && (
              <ProfileView 
                userProfile={userProfile} 
                effectiveAvatar={effectiveAvatar} 
                userInstitutionName={userInstitutionName} 
                profileDraft={profileDraft} 
                setProfileDraft={setProfileDraft} 
                institutions={institutions} 
                updateProfile={updateProfile} 
                isLoading={isLoading} 
                aiPrefs={aiPrefs} 
                saveAiPreferences={saveAiPreferences} 
                systemConfig={systemConfig} 
                historyItems={historyItems} 
                handleSearch={handleSearch} 
              />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
