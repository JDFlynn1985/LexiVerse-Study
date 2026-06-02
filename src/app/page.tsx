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
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { cn, getGravatarUrl } from '@/lib/utils';

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
  Search, 
  BookOpen, 
  Loader2,
  Sun,
  Moon,
  Globe,
  Settings,
  LogOut,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  User,
  Key,
  Code,
  Cpu,
  WifiOff,
  Feather,
  FileText,
  ShieldCheck,
  Languages,
  History,
  Clock,
  ExternalLink,
  ChevronRight,
  ListFilter,
  ArrowRight,
  Plus,
  FileSearch2,
  School,
  MessageSquare,
  Send,
  Building2,
  Users,
  ChevronLeft
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { refineWriting, type WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { checkIntegrity, type AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { formatBibliography, type FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

type ViewMode = 'dashboard' | 'lexicon' | 'wiki' | 'ai-assistant' | 'profile' | 'synthesis' | 'theology' | 'manuscripts' | 'chat';

interface UserProfile {
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

const DESIGNATIONS = [
  'Professor',
  'Undergraduate Seminary Student',
  'Master\'s Degree Candidate',
  'Doctoral Candidate',
  'Non-Seminary Student'
] as const;

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
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

  // Chat State
  const [chatMode, setChatMode] = useState<'global' | 'institutional'>('global');
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [assistantTerm, setAssistantTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
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

  // Synthesis State
  const [synthesisText, setSynthesisText] = useState('');
  const [synthesisResult, setSynthesisResult] = useState<WritingAssistantOutput | null>(null);
  const [integrityResult, setIntegrityResult] = useState<AcademicIntegrityOutput | null>(null);
  const [bibResult, setBibResult] = useState<FormatBibliographyOutput | null>(null);
  
  // Theology State
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
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          setProfileDraft({
            displayName: data.displayName || '',
            credentials: data.credentials || '',
            designation: data.designation || '',
            degreeSubject: data.degreeSubject || '',
            academicLevel: data.academicLevel || '',
            institutionId: data.institutionId || '',
            bio: data.bio || '',
            photoURL: data.photoURL || ''
          });
          if (data.preferences) {
            setAiPrefs(prev => ({
              ...prev,
              ...data.preferences,
              language: data.preferences?.language || language
            }));
          }
        }
      });
      return () => unsub();
    }
  }, [user, db, language]);

  // Chat Subscription
  const chatQuery = useCallback(() => {
    if (!db) return null;
    const base = collection(db, 'messages');
    if (chatMode === 'global') {
      return query(base, where('type', '==', 'global'), orderBy('createdAt', 'desc'), limit(50));
    } else {
      const instId = userProfile?.institutionId || 'independent';
      return query(base, where('type', '==', 'institutional'), where('institutionId', '==', instId), orderBy('createdAt', 'desc'), limit(50));
    }
  }, [db, chatMode, userProfile?.institutionId]);

  const { data: messages } = useCollection<any>(chatQuery());

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || !db) return;

    const msgContent = newMessage;
    setNewMessage('');

    try {
      const userInstitutionName = institutions.find(i => i.id === userProfile?.institutionId)?.name || 'Independent Scholar';
      await addDoc(collection(db, 'messages'), {
        content: msgContent,
        senderUid: user.uid,
        senderName: userProfile?.displayName || user.displayName,
        senderPhotoURL: userProfile?.photoURL || user.photoURL || '',
        senderDesignation: userProfile?.designation || 'Scholar',
        senderInstitutionName: userInstitutionName,
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
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard">
                    <LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} tooltip="Chat Hub">
                    <MessageSquare className="h-5 w-5" /> <span>Chat Hub</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Scholarly Wiki" isActive={activeTab === 'wiki'}>
                    <Link href="/wiki">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" /> <span>Scholarly Wiki</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>AI Research Hub</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} tooltip="Study Assistant">
                    <Sparkles className="h-5 w-5" /> <span>Study Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'theology'} onClick={() => setActiveTab('theology')} tooltip="Theology Explorer">
                    <History className="h-5 w-5" /> <span>Theology Map</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Manuscript Hub" isActive={activeTab === 'manuscripts'}>
                    <Link href="/manuscripts">
                      <div className="flex items-center gap-2">
                        <FileSearch2 className="h-5 w-5" /> <span>Manuscript Hub</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'lexicon'} onClick={() => setActiveTab('lexicon')} tooltip="Lexicon Analysis">
                    <BookOpen className="h-5 w-5" /> <span>Lexicon</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} tooltip="Writing Hub">
                    <Feather className="h-5 w-5" /> <span>Writing Hub</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="API Portal">
                    <Link href="/api-keys">
                      <div className="flex items-center gap-2">
                        <Key className="h-5 w-5" /> <span>API Portal</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {userProfile?.isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Governance</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin API Management">
                      <Link href="/admin/api">
                        <div className="flex items-center gap-2">
                          <Key className="h-5 w-5" /> <span>Admin API Mgmt</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Institution Directory">
                      <Link href="/admin/institutions">
                        <div className="flex items-center gap-2">
                          <School className="h-5 w-5" /> <span>Institutions</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="System Control Panel">
                      <Link href="/admin/settings">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5" /> <span>System Control</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            {systemConfig?.networkMode === 'local-only' && (
              <div className="mb-4 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <WifiOff className="h-3 w-3 text-green-700 dark:text-green-400" />
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
            <div className="mt-4 flex flex-col gap-1 group-data-[collapsible=icon]:hidden">
              <Link href="/privacy" prefetch={false} className="text-[10px] text-muted-foreground hover:underline">Privacy Policy</Link>
              <Link href="/terms" prefetch={false} className="text-[10px] text-muted-foreground hover:underline">Terms of Use</Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            {activeTab === 'dashboard' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                      <GraduationCap className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold font-headline">{t.dashboard.title}</h1>
                      <p className="text-muted-foreground text-lg">{t.dashboard.subtitle}</p>
                    </div>
                  </div>
                </header>

                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="md:col-span-2 shadow-xl border-primary/10 bg-card/50 overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader>
                      <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                        <Sparkles className={cn("h-6 w-6", effectiveApiKey || isLocalMode ? "text-primary" : "text-muted-foreground")} /> 
                        {isLocalMode ? `Local AI Engine (${aiPrefs.selectedModel})` : "Global AI Engine (Gemini)"}
                      </CardTitle>
                      <CardDescription>Synthesize deep theological insights from your digital library.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="relative">
                        <Input 
                          placeholder={effectiveApiKey || isLocalMode ? "e.g. Analyze eschatological fragments in Hebrews..." : "AI Engine Configuration Needed"} 
                          className="h-14 pl-4 pr-16 text-lg rounded-xl shadow-inner border-primary/20 focus:ring-primary/30"
                          value={assistantTerm} 
                          onChange={e => setAssistantTerm(e.target.value)} 
                          onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')} 
                        />
                        <Button 
                          className="absolute right-2 top-2 h-10 w-10 rounded-lg"
                          onClick={() => handleSearch(assistantTerm, 'ai-assistant')} 
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {['Justification', 'Logos', 'Sola Scriptura', 'Sanctification'].map(tag => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1" onClick={() => { setAssistantTerm(tag); handleSearch(tag, 'ai-assistant'); }}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-accent/20 bg-accent/5 flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {historyItems.length > 0 ? historyItems.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg border group cursor-pointer hover:border-primary/40" onClick={() => handleSearch(item.term, item.type as any)}>
                          <span className="font-medium truncate max-w-[120px]">{item.term}</span>
                          <span className="text-[10px] text-muted-foreground">{item.type}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No recent research logged.</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('profile')}>View All History</Button>
                    </CardFooter>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <QuickToolCard 
                    title="Manuscript Hub" 
                    desc="OCR fragment transcription" 
                    icon={<FileSearch2 className="h-6 w-6" />} 
                    asLink="/manuscripts"
                  />
                  <QuickToolCard 
                    title="Theology Map" 
                    desc="Historical concept analysis" 
                    icon={<History className="h-6 w-6" />} 
                    onClick={() => setActiveTab('theology')} 
                  />
                  <QuickToolCard 
                    title="Writing Hub" 
                    desc="Synthesis & integrity" 
                    icon={<Feather className="h-6 w-6" />} 
                    onClick={() => setActiveTab('synthesis')} 
                  />
                  <QuickToolCard 
                    title="Chat Hub" 
                    desc="Real-time scholarly dialogue" 
                    icon={<MessageSquare className="h-6 w-6" />} 
                    onClick={() => setActiveTab('chat')} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-[calc(100vh-12rem)] flex flex-col gap-6 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-primary" /> Social Chat Hub
                    </h1>
                    <p className="text-muted-foreground">Engage in peer discourse and institutional seminars.</p>
                  </div>
                  <div className="flex p-1 bg-muted rounded-lg w-fit self-end">
                    <Button 
                      variant={chatMode === 'global' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setChatMode('global')}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" /> Global
                    </Button>
                    <Button 
                      variant={chatMode === 'institutional' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setChatMode('institutional')}
                      className="gap-2"
                      disabled={!userProfile?.institutionId}
                    >
                      <Building2 className="h-4 w-4" /> {userProfile?.institutionId ? 'My Institution' : 'Institution Required'}
                    </Button>
                  </div>
                </header>

                <Card className="flex-1 flex flex-col shadow-xl border-primary/10 overflow-hidden bg-card/30 backdrop-blur-sm">
                  <CardHeader className="bg-primary/5 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-background/50 border-primary/20">
                        {chatMode === 'global' ? 'DISCOURSE: GLOBAL CHANNEL' : `SEMINAR: ${userInstitutionName}`}
                      </Badge>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Feed Active
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full px-6 py-6">
                      <div className="space-y-6">
                        {[...(messages || [])].reverse().map((msg, i) => {
                          const isOwn = msg.senderUid === user?.uid;
                          return (
                            <div key={msg.id || i} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                              <Avatar className="h-9 w-9 shrink-0 border-2 border-background shadow-sm">
                                <AvatarImage src={msg.senderPhotoURL} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{msg.senderName?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className={cn("flex flex-col max-w-[80%] gap-1", isOwn ? "items-end" : "items-start")}>
                                <div className="flex items-center gap-2 px-1">
                                  <span className="text-[11px] font-bold">{msg.senderName}</span>
                                  <Badge variant="ghost" className="text-[9px] h-4 px-1.5 uppercase tracking-tighter opacity-60">
                                    {msg.senderDesignation}
                                  </Badge>
                                </div>
                                <div 
                                  className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm border",
                                    isOwn 
                                      ? "bg-primary text-primary-foreground rounded-tr-none border-primary" 
                                      : "bg-background rounded-tl-none border-border"
                                  )}
                                >
                                  <p className="leading-relaxed">{msg.content}</p>
                                </div>
                                <span className="text-[9px] text-muted-foreground px-1">
                                  {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                                  {chatMode === 'global' && msg.senderInstitutionName && ` • ${msg.senderInstitutionName}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                        {messages?.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
                            <MessageSquare className="h-16 w-16" />
                            <p className="italic">The scholarly discourse begins with a single word.</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="p-4 bg-muted/30 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                      <Input 
                        placeholder={user ? "Share your scholarly insights..." : "Please sign in to participate..."} 
                        className="h-11 rounded-xl bg-background border-primary/20 shadow-inner"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        disabled={!user}
                      />
                      <Button type="submit" disabled={!user || !newMessage.trim()} className="h-11 w-11 rounded-xl shrink-0 shadow-lg">
                        <Send className="h-5 w-5" />
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === 'synthesis' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Feather className="h-8 w-8 text-primary" /> Academic Synthesis Hub
                  </h1>
                  <p className="text-muted-foreground">Refine your research, check integrity, and format bibliographies.</p>
                </header>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-4">
                    <Label className="text-lg font-bold">Research Draft</Label>
                    <Textarea 
                      placeholder="Paste your draft or raw source list here..." 
                      className="min-h-[400px] text-lg font-body leading-relaxed shadow-inner"
                      value={synthesisText}
                      onChange={e => setSynthesisText(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleSynthesisAction('refine')} disabled={isLoading || !synthesisText.trim()}>
                        <Sparkles className="mr-2 h-4 w-4" /> Refine Tone
                      </Button>
                      <Button variant="secondary" onClick={() => handleSynthesisAction('integrity')} disabled={isLoading || !synthesisText.trim()}>
                        <ShieldCheck className="mr-2 h-4 w-4" /> Integrity Scan
                      </Button>
                      <Button variant="outline" onClick={() => handleSynthesisAction('bib')} disabled={isLoading || !synthesisText.trim()}>
                        <ListFilter className="mr-2 h-4 w-4" /> Format Bib
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Tabs defaultValue="results" className="w-full">
                      <TabsList className="w-full grid grid-cols-3">
                        <TabsTrigger value="results">Refined Text</TabsTrigger>
                        <TabsTrigger value="integrity">Integrity Report</TabsTrigger>
                        <TabsTrigger value="bib">Bibliography</TabsTrigger>
                      </TabsList>
                      <TabsContent value="results" className="mt-4">
                        <Card className="min-h-[400px]">
                          <CardContent className="pt-6">
                            {synthesisResult ? (
                              <div className="space-y-6">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap leading-relaxed">{synthesisResult.improvedText}</p>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                  <h4 className="font-bold text-xs uppercase text-primary">Corrections Made</h4>
                                  <div className="grid gap-2">
                                    {synthesisResult.corrections.map((c, i) => (
                                      <div key={i} className="text-xs p-2 bg-muted rounded border-l-4 border-primary">
                                        <span className="line-through text-muted-foreground">{c.original}</span> → <span className="font-bold">{c.replacement}</span>
                                        <p className="mt-1 italic opacity-70">{c.reason}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                                <Sparkles className="h-10 w-10 mb-2 opacity-20" />
                                <p>Select 'Refine Tone' to see AI improvements.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="integrity" className="mt-4">
                        <Card className="min-h-[400px]">
                          <CardContent className="pt-6">
                            {integrityResult ? (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-headline text-lg">Integrity Score</h3>
                                  <Badge className={cn(integrityResult.integrityScore > 80 ? "bg-green-600" : "bg-orange-600")}>
                                    {integrityResult.integrityScore}/100
                                  </Badge>
                                </div>
                                <div className="space-y-4">
                                  {integrityResult.findings.map((f, i) => (
                                    <div key={i} className="p-4 bg-muted/50 rounded-lg border-l-4 border-accent space-y-2">
                                      <p className="text-sm font-medium">"{f.problematicText}"</p>
                                      <p className="text-xs text-muted-foreground">{f.explanation}</p>
                                      <div className="pt-2">
                                        <p className="text-[10px] font-bold uppercase text-accent">Citation Suggestion</p>
                                        <code className="text-[11px] block mt-1 bg-background p-2 rounded border font-mono">{f.citationSuggestion}</code>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                                <ShieldCheck className="h-10 w-10 mb-2 opacity-20" />
                                <p>Run 'Integrity Scan' to identify missing citations.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="bib" className="mt-4">
                         <Card className="min-h-[400px]">
                          <CardContent className="pt-6">
                            {bibResult ? (
                              <div className="space-y-6">
                                <div className="p-4 bg-muted/50 rounded-lg border font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                                  {bibResult.formattedOutput}
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-bold text-xs uppercase text-primary">Style: {bibResult.styleApplied}</h4>
                                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                                    {bibResult.formattingNotes.map((n, i) => <li key={i}>{n}</li>)}
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                                <ListFilter className="h-10 w-10 mb-2 opacity-20" />
                                <p>Provide source names and click 'Format Bib'.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'theology' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <History className="h-8 w-8 text-primary" /> Theological Concept Mapper
                  </h1>
                  <p className="text-muted-foreground">Deep analysis of systemic theological terms and historical development.</p>
                </header>

                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter a concept (e.g. Atonement, Sovereignty, Trinity)..." 
                    className="h-12 text-lg shadow-sm"
                    value={theologyTerm}
                    onChange={e => setTheologyTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(theologyTerm, 'theology')}
                  />
                  <Button size="lg" onClick={() => handleSearch(theologyTerm, 'theology')} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>

                {theologyResult ? (
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                          <CardTitle className="font-headline text-2xl">{theologyResult.concept}</CardTitle>
                          <CardDescription className="italic">{theologyResult.etymology}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <h4 className="font-bold text-sm uppercase text-primary mb-2">Formal Definition</h4>
                            <p className="text-lg leading-relaxed text-foreground/80">{theologyResult.definition}</p>
                          </div>
                          
                          <Separator />

                          <div>
                            <h4 className="font-bold text-sm uppercase text-primary mb-4">Historical Development</h4>
                            <div className="space-y-6 relative border-l-2 border-primary/20 pl-6 ml-2">
                              {theologyResult.historicalDevelopment.map((dev, i) => (
                                <div key={i} className="relative">
                                  <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                                  <h5 className="font-bold text-lg">{dev.period}</h5>
                                  <p className="text-sm text-muted-foreground mb-2">{dev.keyDevelopment}</p>
                                  <div className="flex flex-wrap gap-1">
                                    {dev.notableFigures.map(fig => <Badge key={fig} variant="outline" className="text-[10px]">{fig}</Badge>)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-md border-accent/20">
                        <CardHeader>
                          <CardTitle className="text-lg font-headline">Academic Synthesis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{theologyResult.academicSynthesis}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader><CardTitle className="text-lg font-headline">Scriptural Anchors</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {theologyResult.keyVerses.map((v, i) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg border group cursor-pointer hover:border-primary/40">
                              <p className="font-bold text-primary text-sm flex items-center justify-between">
                                {v.reference} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{v.significance}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="bg-primary text-primary-foreground">
                        <CardHeader><CardTitle className="text-lg font-headline">Scholarly Bib</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap opacity-80">{theologyResult.bibliography}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  !isLoading && (
                    <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/10">
                      <History className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
                      <h3 className="text-xl font-headline font-bold text-muted-foreground">Start Your Theological Journey</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">Map the history of salvation and the development of Christian thought with AI assistance.</p>
                    </div>
                  )
                )}
              </div>
            )}

            {activeTab === 'lexicon' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-primary" /> Lexicon Explorer
                  </h1>
                  <p className="text-muted-foreground">In-depth original language analysis using Strong's concordance data.</p>
                </header>

                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter Strong's Number (e.g. G3056)..." 
                    className="h-12 shadow-sm"
                    onKeyDown={e => e.key === 'Enter' && handleSearch(e.currentTarget.value, 'lexicon')}
                  />
                  <Button size="lg" onClick={() => {
                    const el = document.querySelector('input[placeholder*="Strong"]') as HTMLInputElement;
                    if (el) handleSearch(el.value, 'lexicon');
                  }} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>

                {lexiconResult && (
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="shadow-lg border-primary/10 overflow-hidden">
                        <div className="h-2 bg-primary w-full" />
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-4xl font-bold font-headline mb-1">{lexiconResult.originalWord}</CardTitle>
                            <CardDescription className="text-lg">{lexiconResult.transliteration} | {lexiconResult.pronunciation}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-lg py-1 px-4">{lexiconResult.searchStrongNumber}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="p-4 bg-muted/50 rounded-xl border">
                              <Label className="text-[10px] uppercase font-bold text-primary">Part of Speech</Label>
                              <p className="text-lg font-medium">{lexiconResult.partOfSpeech}</p>
                            </div>
                            <div className="p-4 bg-muted/50 rounded-xl border">
                              <Label className="text-[10px] uppercase font-bold text-primary">Classification</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lexiconResult.classification.map(c => <Badge key={c} variant="outline">{c}</Badge>)}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-sm uppercase text-primary mb-2">Academic Definition</h4>
                            <p className="text-lg leading-relaxed">{lexiconResult.definition}</p>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-bold text-sm uppercase text-primary mb-2">Scholarly Summary</h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">{lexiconResult.summary}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-xl font-headline">Contextual Verse Usages</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {lexiconResult.verseOccurrences.map((v, i) => (
                              <div key={i} className="p-4 bg-muted/30 rounded-xl border group hover:border-primary/40 transition-all">
                                <p className="font-bold text-primary mb-2 flex items-center justify-between">
                                  {v.reference} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </p>
                                <p className="text-sm italic leading-relaxed mb-3">"{v.text}"</p>
                                <div className="p-2 bg-background rounded text-[11px] text-muted-foreground border border-dashed">
                                  <span className="font-bold text-primary">Nuance:</span> {v.contextualMeaning}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-accent/20 bg-accent/5">
                        <CardHeader><CardTitle className="text-lg font-headline">Commentary Insights</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {lexiconResult.commentaryInsights.map((insight, i) => (
                            <div key={i} className="text-sm space-y-1">
                              <p className="font-bold text-accent">{insight.commentator}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{insight.insight}</p>
                              {insight.relevantVerse && <p className="text-[10px] italic">{insight.relevantVerse}</p>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-lg font-headline">Etymological Roots</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {lexiconResult.roots?.map((root, i) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg border">
                              <p className="font-bold text-sm text-primary">{root.root}</p>
                              <p className="text-xs text-muted-foreground mt-1">{root.definition}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="bg-primary text-primary-foreground">
                        <CardHeader><CardTitle className="text-lg font-headline">Bibliography</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap opacity-80">{lexiconResult.bibliography}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai-assistant' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header>
                  <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-primary" /> AI Study Assistant
                  </h1>
                  <p className="text-muted-foreground">Comprehensive research synthesis from scriptures and uploaded context.</p>
                </header>

                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter a research topic or reference..." 
                    className="h-12 shadow-sm"
                    value={assistantTerm}
                    onChange={e => setAssistantTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
                  />
                  <Button size="lg" onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>

                {assistantResult && (
                  <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-3xl font-headline mb-1">{assistantResult.originalWord}</CardTitle>
                              <CardDescription className="text-lg">{assistantResult.transliteration} | {assistantResult.pronunciation}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Save to Library</Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          <div>
                            <h4 className="font-bold text-sm uppercase text-primary mb-3">AI Research Insights</h4>
                            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">{assistantResult.aiInsights}</p>
                          </div>
                          
                          <Separator />

                          <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                              <h4 className="font-bold text-xs uppercase text-primary">Scholarly Definitions</h4>
                              <ul className="space-y-2">
                                {assistantResult.definitions.map((d, i) => <li key={i} className="text-sm bg-muted/50 p-3 rounded-lg border-l-2 border-primary">{d}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-4">
                              <h4 className="font-bold text-xs uppercase text-primary">Commentary Context</h4>
                              <p className="text-sm text-muted-foreground italic leading-relaxed">{assistantResult.commentaryInsights}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader><CardTitle className="text-lg font-headline">Cited Verses</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {assistantResult.verseUsages.map((v, i) => (
                            <Link key={i} href={v.url} target="_blank" className="flex items-center justify-between text-xs p-3 bg-muted/50 rounded-lg border group hover:border-primary/40">
                              <span className="font-medium text-primary">{v.text}</span>
                              <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                            </Link>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle className="text-lg font-headline">Bibliography (SBL Style)</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {assistantResult.bibliography.map((b, i) => (
                            <Link key={i} href={b.url} target="_blank" className="block text-[10px] p-2 bg-muted/30 rounded border hover:border-primary/40">
                              {b.text}
                            </Link>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && userProfile && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header><h1 className="text-3xl font-bold font-headline">Scholarly Profile</h1></header>
                <div className="grid gap-8 md:grid-cols-3">
                  <Card className="md:col-span-1 shadow-lg border-primary/10 h-fit">
                    <CardHeader className="text-center pb-2">
                      <div className="relative mx-auto w-32 h-32 mb-4">
                        <Avatar className="w-full h-full border-4 border-background shadow-xl">
                          <AvatarImage src={effectiveAvatar} />
                          <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                        </Avatar>
                      </div>
                      <CardTitle className="font-headline">{userProfile.displayName}</CardTitle>
                      <CardDescription className="truncate px-4">{userInstitutionName}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>Display Name</Label>
                        <Input value={profileDraft.displayName} onChange={e => setProfileDraft({...profileDraft, displayName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label>Academic Designation</Label>
                        <Select 
                          value={profileDraft.designation} 
                          onValueChange={(val: any) => setProfileDraft({...profileDraft, designation: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select designation" />
                          </SelectTrigger>
                          <SelectContent>
                            {DESIGNATIONS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Institution</Label>
                        <Select 
                          value={profileDraft.institutionId} 
                          onValueChange={(val) => setProfileDraft({...profileDraft, institutionId: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select institution" />
                          </SelectTrigger>
                          <SelectContent>
                            {institutions.map((inst) => (
                              <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                            ))}
                            <SelectItem value="">Independent Scholar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Degree Subject</Label>
                        <Input 
                          value={profileDraft.degreeSubject} 
                          onChange={e => setProfileDraft({...profileDraft, degreeSubject: e.target.value})} 
                          placeholder="e.g. Biblical Languages, Theology..." 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Current Year / Academic Level</Label>
                        <Input 
                          value={profileDraft.academicLevel} 
                          onChange={e => setProfileDraft({...profileDraft, academicLevel: e.target.value})} 
                          placeholder="e.g. Freshman, Junior, Year 2..." 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Academic Titles (e.g. PhD, MDiv)</Label>
                        <Input value={profileDraft.credentials} onChange={e => setProfileDraft({...profileDraft, credentials: e.target.value})} placeholder="PhD, MDiv..." />
                      </div>
                      <Button className="w-full" onClick={updateProfile} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null} Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-lg border-primary/10">
                      <CardHeader>
                        <CardTitle className="text-xl font-headline flex items-center gap-2">
                          <Cpu className="h-5 w-5 text-primary" /> AI Hub Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>AI Research Engine</Label>
                            <Select 
                              value={aiPrefs.modelProvider} 
                              onValueChange={(val: 'google' | 'local') => saveAiPreferences({ 
                                modelProvider: val, 
                                selectedModel: val === 'google' ? 'googleai/gemini-2.5-flash' : (systemConfig?.localModelList?.[0] || 'llama3') 
                              })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="google">Google Gemini (Cloud)</SelectItem>
                                <SelectItem value="local">Ollama (Local Network)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Active Model</Label>
                            <Select 
                              value={aiPrefs.selectedModel} 
                              onValueChange={(val) => saveAiPreferences({ selectedModel: val })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {aiPrefs.modelProvider === 'google' ? (
                                  <>
                                    <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                    <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                  </>
                                ) : (
                                  systemConfig?.localModelList?.map((m: string) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Personal Gemini API Key</Label>
                            <Badge variant="outline" className="text-[10px]">{aiPrefs.storagePreference === 'local' ? 'Stored Locally' : 'Cloud Sync'}</Badge>
                          </div>
                          <Input 
                            type="password" 
                            placeholder="Enter your personal Google AI key..." 
                            value={aiPrefs.storagePreference === 'local' ? localApiKey : aiPrefs.customApiKey}
                            onChange={e => saveAiPreferences({ customApiKey: e.target.value })}
                          />
                          <p className="text-[10px] text-muted-foreground">Priority is given to your personal key over the system default.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-lg font-headline">Research History</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-2">
                            {historyItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border text-sm group cursor-pointer hover:border-primary/40" onClick={() => handleSearch(item.term, item.type as any)}>
                                <div className="flex flex-col">
                                  <span className="font-bold">{item.term}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{item.type} • {item.date}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function QuickToolCard({ title, desc, icon, onClick, asLink }: { title: string, desc: string, icon: React.ReactNode, onClick?: () => void, asLink?: string }) {
  const content = (
    <div className="flex flex-col">
      <div className="mb-4 p-3 bg-primary/5 rounded-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors inline-block w-fit">
        {icon}
      </div>
      <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );

  if (asLink) {
    return (
      <Link href={asLink} className="p-6 cursor-pointer border rounded-lg transition-all hover:shadow-lg hover:border-primary/30 group bg-card/50">
        {content}
      </Link>
    );
  }

  return (
    <Card 
      className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 group bg-card/50"
      onClick={onClick}
    >
      {content}
    </Card>
  );
}
