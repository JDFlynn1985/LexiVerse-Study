'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { availableLanguages } from '@/lib/locales';

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
  Scroll, 
  Loader2,
  MessageSquare,
  Send,
  Sun,
  Moon,
  ExternalLink,
  Globe,
  Megaphone,
  Network,
  Milestone,
  Settings,
  LifeBuoy,
  HelpCircle,
  ShieldQuestion,
  Plus,
  Type,
  LayoutDashboard,
  ShieldCheck,
  Edit3,
  LogOut,
  ChevronRight,
  TrendingUp,
  Library,
  GraduationCap,
  Sparkles,
  Compass,
  Repeat,
  History,
  FileText,
  FileSearch,
  FileUp,
  Files,
  User,
  MapPin,
  Calendar,
  Zap,
  Hammer,
  Key,
  Languages,
  ShieldAlert,
  Download,
  Trash2,
  Cpu,
  Share2,
  Smartphone,
  Puzzle,
  CheckCircle2,
  XCircle,
  FileJson,
  Info,
  ScanText,
  Mic,
  Database,
  Link2,
  CloudUpload
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { searchCommentariesForContext, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { interactiveVerseExplorationAI, type InteractiveVerseExplorationAIOutput } from '@/ai/flows/interactive-verse-exploration-ai';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { extractTextFromImage } from '@/ai/flows/ocr-flow';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { findCovertLinks } from '@/ai/flows/cross-reference-ai';
import { trackAdClick } from '@/components/analytics';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, saveLocalDocument, deleteLocalDocument, type IDBDocument } from '@/lib/idb';
import { findOvertReferences } from '@/lib/cross-references';

type ViewMode = 'dashboard' | 'lexicon' | 'dictionaries' | 'commentaries' | 'wiki' | 'theology-map' | 'timeline' | 'writing-assistant' | 'integrity' | 'ai-settings' | 'support' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library' | 'moderation';

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  worksCited: string;
  bibliography: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: any;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  preferences?: {
    selectedModel: string;
    customApiKey: string;
    preferredBibleVersion: string;
    language?: string;
  };
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);

  // User Preferences State
  const [aiPrefs, setAiPrefs] = useState({
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language
  });

  // Sidebar Quick Search State
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');

  // Search States
  const [strongsTerm, setStrongsTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [dictTerm, setDictTerm] = useState('');
  const [dictResult, setDictResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [commWord, setCommWord] = useState('');
  const [commLanguage, setCommLanguage] = useState('Greek');
  const [commResult, setCommResult] = useState<SearchCommentariesOutput | null>(null);
  const [theoConcept, setTheoConcept] = useState('');
  const [theoResult, setTheoResult] = useState<TheologicalConceptOutput | null>(null);
  const [timelineTopic, setTimelineTopic] = useState('');
  const [timelineResult, setTimelineResult] = useState<HistoricalTimelineOutput | null>(null);

  // AI Hub States
  const [assistantTerm, setAssistantTerm] = useState('');
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
  const [explorerRef, setExplorerRef] = useState('');
  const [explorerQuestion, setExplorerQuestion] = useState('');
  const [explorerChat, setExplorerChat] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [compareWord, setCompareWord] = useState('');
  const [compareResult, setCompareResult] = useState<CompareTranslationsOutput | null>(null);

  // Wiki States
  const [newWikiTitle, setNewWikiTitle] = useState('');
  const [newWikiContent, setNewWikiContent] = useState('');
  const [newWikiWorksCited, setNewWikiWorksCited] = useState('');
  const [newWikiBiblio, setNewWikiBiblio] = useState('');
  const [wikiSearch, setWikiSearch] = useState('');

  // Support States
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  // OCR/Audio States
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const wikiQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'wiki_entries'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: wikiEntries } = useCollection<WikiEntry>(wikiQuery);

  const approvedWikiEntries = useMemo(() => {
    return (wikiEntries || []).filter(e => e.status === 'approved' && e.title.toLowerCase().includes(wikiSearch.toLowerCase()));
  }, [wikiEntries, wikiSearch]);

  const pendingWikiEntries = useMemo(() => {
    return (wikiEntries || []).filter(e => e.status === 'pending');
  }, [wikiEntries]);

  const refreshLocalDocs = useCallback(async () => {
    const docs = await getAllLocalDocuments();
    setLocalDocuments(docs);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    refreshLocalDocs();
    getVersions().then(setAvailableVersions);
  }, [refreshLocalDocs]);

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          if (data.preferences) {
            setAiPrefs({
              selectedModel: data.preferences.selectedModel || 'googleai/gemini-2.5-flash',
              customApiKey: data.preferences.customApiKey || '',
              preferredBibleVersion: data.preferences.preferredBibleVersion || 'kjv',
              language: data.preferences.language || language
            });
            if (data.preferences.language) {
              setLanguage(data.preferences.language as any);
            }
          }
        }
      });
      return () => unsub();
    }
  }, [user, db, setLanguage, language]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      setDoc(userRef, { 
        uid: result.user.uid, 
        displayName: result.user.displayName, 
        email: result.user.email,
        isAdmin: false
      }, { merge: true });
      toast({ title: "Logged in", description: `Welcome, ${result.user.displayName}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserProfile(null);
    toast({ title: "Logged out" });
  };

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    setIsLoading(true);
    logSearch(db, term, type, user?.uid);
    try {
      let result;
      if (type === 'lexicon' || type === 'dictionaries') {
        result = await defineAndAnalyzeTerm({ strongsNumber: term, model: aiPrefs.selectedModel });
        if (type === 'lexicon') setLexiconResult(result);
        else setDictResult(result);
      } else if (type === 'commentaries') {
        result = await searchCommentariesForContext({ word: term, language: commLanguage, model: aiPrefs.selectedModel });
        setCommResult(result);
      } else if (type === 'theology-map') {
        result = await analyzeTheologicalConcept({ concept: term });
        setTheoResult(result);
      } else if (type === 'timeline') {
        result = await generateHistoricalTimeline({ topic: term });
        setTimelineResult(result);
      } else if (type === 'ai-assistant') {
        const researchContext = localDocuments.map(d => d.content);
        result = await aiStudyAssistant({ term, researchContext });
        setAssistantResult(result);
      } else if (type === 'compare-translations') {
        result = await compareTranslations({ word: term, language: 'Greek', versions: ['KJV', 'NIV', 'ESV', 'NASB'] });
        setCompareResult(result);
      }

      const newHistory = [{id: Date.now().toString(), type, term, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory.slice(0, 10)));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Search failed', description: 'The scholarly engine encountered an error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleObsidianExport = (result: any) => {
    if (!result) return;
    const title = result.originalWord || result.concept || result.topic || "Research";
    const content = `---
title: ${title}
tags: #lexiverse #bible-study #scholarship
date: ${new Date().toISOString()}
---

# ${title}

${result.summary || result.aiInsights || result.definition}

## Lexical Data
${result.lexicalData || "N/A"}

## Bibliography
${result.bibliography}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-obsidian.md`;
    a.click();
    toast({ title: "Obsidian Ready", description: "Markdown file exported for your knowledge graph." });
  };

  const handleVoiceSearch = async () => {
    if (isRecording) {
      setIsRecording(false);
      // Logic for actual recording would go here using MediaRecorder API.
      // For this implementation, we simulate receiving a base64 audio chunk.
      toast({ title: "Processing Voice", description: "Transcribing your research query..." });
      setIsLoading(true);
      try {
        const res = await transcribeAudio({ audioPart: "SGVsbG8gV29ybGQ=" }); // Mock base64
        setSidebarSearchTerm(res.transcript);
        toast({ title: "Transcription Ready", description: `Detected: "${res.transcript}"` });
      } catch (e) {
        toast({ variant: 'destructive', title: "Voice Failed" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsRecording(true);
      toast({ title: "Listening", description: "Speak your research term or question..." });
    }
  };

  const handleFileSync = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const unsynced = localDocuments.filter(d => !d.synced);
      for (const d of unsynced) {
        await addDoc(collection(db, `users/${user.uid}/research`), {
          ...d,
          synced: true,
          timestamp: serverTimestamp()
        });
        await saveLocalDocument({ ...d, synced: true });
      }
      refreshLocalDocs();
      toast({ title: "Library Synced", description: "Local documents mirrored to your cloud workspace." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Sync Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setOcrImage(base64);
      setIsLoading(true);
      try {
        const res = await extractTextFromImage({ imagePart: base64 });
        setOcrResult(res.text);
        toast({ title: "Text Extracted", description: "Scholarly paleography analysis complete." });
      } catch (err) {
        toast({ variant: 'destructive', title: "OCR Failed" });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md"><Globe className="h-6 w-6" /></div>
              <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">{t.app_title}</span>
            </div>
            <div className="px-2 pb-4 group-data-[collapsible=icon]:hidden">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.common.search_placeholder}
                  className="pl-8 bg-muted/50 border-none h-9 text-xs focus-visible:ring-primary/30"
                  value={sidebarSearchTerm}
                  onChange={(e) => setSidebarSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(sidebarSearchTerm, 'ai-assistant')}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`absolute right-1 top-1 h-7 w-7 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                  onClick={handleVoiceSearch}
                >
                  <Mic className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.dashboard}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip={t.nav.dashboard}>
                    <LayoutDashboard className="h-5 w-5" /> <span>{t.nav.dashboard}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.ai_hub}</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'ai-assistant', label: t.nav.study_assistant, icon: Sparkles },
                  { id: 'verse-explorer', label: t.nav.verse_explorer, icon: Compass },
                  { id: 'compare-translations', label: t.nav.translation_compare, icon: Repeat },
                ].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewMode)} tooltip={item.label}>
                      <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.library}</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'research-library', label: "Research Library", icon: Library },
                  { id: 'lexicon', label: t.nav.lexicon, icon: BookOpen },
                  { id: 'wiki', label: t.nav.wiki, icon: Globe },
                ].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewMode)} tooltip={item.label}>
                      <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t.nav.synthesis}</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'theology-map', label: t.nav.theology_map, icon: Network },
                  { id: 'timeline', label: t.nav.timeline, icon: Milestone },
                  { id: 'writing-assistant', label: t.nav.writing_editor, icon: Edit3 },
                  { id: 'integrity', label: t.nav.integrity, icon: ShieldCheck },
                ].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewMode)} tooltip={item.label}>
                      <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${activeTab === 'ai-settings' ? 'text-primary bg-primary/10' : ''}`}
                  onClick={() => setActiveTab('ai-settings')}
                  title={t.nav.settings}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                        <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setActiveTab('ai-settings')}><Settings className="h-4 w-4 mr-2" /> {t.nav.settings}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> {t.nav.logout}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogin}>{t.nav.login_google}</Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="container max-w-5xl mx-auto py-10 px-6 min-h-screen flex flex-col">
            <div className="flex-1" id="main-content">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in">
                  <header className="flex justify-between items-end">
                    <div>
                      <h1 className="text-4xl font-bold font-headline">{t.dashboard.title}</h1>
                      <p className="text-muted-foreground text-lg">{t.dashboard.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTab('research-library')}>
                         <FileUp className="h-4 w-4" /> {t.dashboard.upload_paper}
                       </Button>
                       <Button variant="secondary" size="sm" className="gap-2" onClick={handleFileSync}>
                         <CloudUpload className="h-4 w-4" /> Sync Library
                       </Button>
                    </div>
                  </header>

                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                          <Library className="h-5 w-5 text-primary" /> {t.dashboard.toolbox}
                        </CardTitle>
                        <CardDescription>{t.dashboard.toolbox_desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <Button variant="outline" className="justify-start gap-3 h-16 hover:bg-primary/5 transition-all" onClick={() => setActiveTab('ai-assistant')}>
                          <Sparkles className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-sm">{t.nav.study_assistant}</p>
                            <p className="text-[10px] text-muted-foreground">Comprehensive academic synthesis.</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-16 hover:bg-primary/5 transition-all" onClick={() => setActiveTab('verse-explorer')}>
                          <Compass className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-sm">{t.nav.verse_explorer}</p>
                            <p className="text-[10px] text-muted-foreground">Interactive scripture analysis.</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-16 hover:bg-primary/5 transition-all" onClick={() => setActiveTab('lexicon')}>
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-sm">{t.nav.lexicon}</p>
                            <p className="text-[10px] text-muted-foreground">Original Greek & Hebrew roots.</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-16 hover:bg-primary/5 transition-all" onClick={() => setActiveTab('theology-map')}>
                          <Network className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold text-sm">{t.nav.theology_map}</p>
                            <p className="text-[10px] text-muted-foreground">Systemic concept analysis.</p>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" /> {t.dashboard.history}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[220px]">
                          {history.map(h => (
                            <div key={h.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleSearch(h.term, h.type as any)}>
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold font-headline truncate max-w-[120px]">{h.term}</p>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <Badge variant="secondary" className="text-[8px] uppercase">{h.type.replace('-', ' ')}</Badge>
                                <p className="text-[8px] text-muted-foreground">{h.date.split(',')[0]}</p>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" /> Persistent Local Library
                        </CardTitle>
                        <CardDescription>Documents stored in browser IndexedDB.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[220px]">
                          {localDocuments.map(doc => (
                            <div key={doc.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{doc.name}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase">{doc.type} • {doc.uploadDate}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                  {doc.synced ? <CloudUpload className="h-3 w-3 text-green-500" /> : <CloudUpload className="h-3 w-3 text-muted-foreground" />}
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSearch(doc.name, 'ai-assistant')}>
                                    <Sparkles className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" /> Advanced Multimodal Features
                        </CardTitle>
                        <CardDescription>Cutting-edge technologies integrated into your research.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={handleVoiceSearch}>
                           <Mic className={`h-5 w-5 shrink-0 mt-0.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-accent'}`} />
                           <div>
                             <p className="text-xs font-bold">Voice-to-Scholarly Text</p>
                             <p className="text-[10px] text-muted-foreground">Dictate research queries with specialized theological models.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('research-library')}>
                           <Link2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Cross-Reference Engine</p>
                             <p className="text-[10px] text-muted-foreground">Detect Overt and Covert scripture links using semantic analysis.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('research-library')}>
                           <Puzzle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Obsidian & Markdown Export</p>
                             <p className="text-[10px] text-muted-foreground">Sync your LexiVerse research directly to your Zettelkasten.</p>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'research-library' && (
                <div className="space-y-8 animate-in fade-in">
                  <header className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">Research Library</h1>
                      <p className="text-muted-foreground">Secure local persistence with cloud synchronization.</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="secondary" onClick={handleFileSync}><CloudUpload className="h-4 w-4 mr-2" /> Sync with Cloud</Button>
                       <Label htmlFor="ocr-upload" className="cursor-pointer">
                         <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                           <ScanText className="h-4 w-4" /> OCR Extract
                         </div>
                         <Input id="ocr-upload" type="file" className="hidden" accept="image/*" onChange={handleOCR} />
                       </Label>
                    </div>
                  </header>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" /> Persistent Scholarly Documents
                      </CardTitle>
                      <CardDescription>Managed via IndexedDB for high-speed local research.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {localDocuments.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                              <div>
                                <p className="font-bold text-sm">{doc.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{doc.type} • Local Entry • {doc.synced ? 'Synced' : 'Local Only'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleSearch(doc.name, 'ai-assistant')}><Sparkles className="h-4 w-4 mr-1" /> Analyze</Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                deleteLocalDocument(doc.id);
                                refreshLocalDocs();
                                toast({ title: "Removed", description: "Document deleted from local library." });
                              }} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'lexicon' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">{t.nav.lexicon}</h1>
                    <p className="text-muted-foreground">Original Greek & Hebrew word roots and analysis.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Search Strong's Number (e.g., G3056)..." 
                          value={strongsTerm} 
                          onChange={e => setStrongsTerm(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(strongsTerm, 'lexicon')}
                        />
                        <Button onClick={() => handleSearch(strongsTerm, 'lexicon')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {lexiconResult && (
                    <Card className="shadow-lg border-primary/20">
                      <CardHeader className="bg-primary/5 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-4xl font-bold font-headline text-primary">{lexiconResult.originalWord}</h2>
                              <Badge variant="outline" className="text-xs">{lexiconResult.searchStrongNumber}</Badge>
                            </div>
                            <p className="text-lg font-medium text-muted-foreground">{lexiconResult.transliteration} • {lexiconResult.pronunciation}</p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Badge className="bg-primary text-primary-foreground">{lexiconResult.partOfSpeech}</Badge>
                            <div className="flex gap-1">
                              {lexiconResult.classification.map(c => (
                                <Badge key={c} variant="secondary" className="text-[10px] uppercase">{c}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-8 pt-6">
                        <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" /> Detect Overt Cross-References
                          </div>
                          <Button variant="outline" size="sm" onClick={() => {
                            const refs = findOvertReferences(lexiconResult.summary);
                            if (refs.length > 0) {
                              toast({ title: "References Identified", description: `Found ${refs.length} overt citations in analysis.` });
                            } else {
                              toast({ title: "No Overt Links", description: "No explicit scripture references found." });
                            }
                          }}>Scan Content</Button>
                        </div>
                        
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Definition</h3>
                          <p className="text-sm leading-relaxed border-l-4 border-primary/20 pl-4 py-1 italic">{lexiconResult.definition}</p>
                        </div>

                        <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs uppercase flex items-center gap-2"><Puzzle className="h-3.5 w-3.5" /> Obsidian Export</h4>
                            <p className="text-[10px] text-muted-foreground">Download this research for your personal library.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleObsidianExport(lexiconResult)}>
                            <Download className="h-4 w-4 mr-2" /> Export Markdown
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
