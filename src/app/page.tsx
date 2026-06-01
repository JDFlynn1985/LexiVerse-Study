'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ScanText
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
import { trackAdClick } from '@/components/analytics';
import { getVersions, type BibleVersion } from '@/lib/bible-api';

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

interface ResearchDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  content: string;
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
  const [recentDocuments, setRecentDocuments] = useState<ResearchDocument[]>([]);
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

  // OCR States
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

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

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedDocs = localStorage.getItem('lexiverse_documents');
    if (savedDocs) {
      setRecentDocuments(JSON.parse(savedDocs));
    } else {
      const samples: ResearchDocument[] = [
        { id: '1', name: 'Analysis of Hellenistic Syncretism.pdf', type: 'PDF', uploadDate: new Date().toLocaleDateString(), content: 'The convergence of Greek and Jewish thought...' },
        { id: '2', name: 'Pauline Eschatology Draft.docx', type: 'DOCX', uploadDate: new Date().toLocaleDateString(), content: 'Investigating the "Already/Not Yet" tension...' }
      ];
      setRecentDocuments(samples);
      localStorage.setItem('lexiverse_documents', JSON.stringify(samples));
    }

    getVersions().then(setAvailableVersions);
  }, []);

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
        isAdmin: false // Default to false
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      toast({ title: "Account Deleted", description: "All your data has been purged according to retention policies." });
      setUserProfile(null);
      setActiveTab('dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: "For security, please re-authenticate and try again." });
    } finally {
      setIsLoading(false);
    }
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
        const researchContext = recentDocuments.map(d => d.content);
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

  const handleSidebarSearch = () => {
    if (!sidebarSearchTerm.trim()) return;
    const isStrongs = /^[GH]\d+/.test(sidebarSearchTerm.trim().toUpperCase());
    if (isStrongs) {
      setActiveTab('lexicon');
      setStrongsTerm(sidebarSearchTerm);
      handleSearch(sidebarSearchTerm, 'lexicon');
    } else {
      setActiveTab('ai-assistant');
      setAssistantTerm(sidebarSearchTerm);
      handleSearch(sidebarSearchTerm, 'ai-assistant');
    }
    setSidebarSearchTerm('');
  };

  const handleSavePreferences = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: {
          selectedModel: aiPrefs.selectedModel,
          customApiKey: aiPrefs.customApiKey,
          preferredBibleVersion: aiPrefs.preferredBibleVersion,
          language: aiPrefs.language
        }
      });
      toast({ title: "Preferences Saved", description: "Your academic environment has been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWikiSubmit = async () => {
    if (!user || !db) return;
    if (!newWikiTitle || !newWikiContent) return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'wiki_entries'), {
        title: newWikiTitle,
        content: newWikiContent,
        worksCited: newWikiWorksCited,
        bibliography: newWikiBiblio,
        status: 'pending',
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
      toast({ title: "Submitted", description: "Your article has been sent for scholarly peer review." });
      setNewWikiTitle('');
      setNewWikiContent('');
      setNewWikiWorksCited('');
      setNewWikiBiblio('');
    } catch (e) {
      toast({ variant: 'destructive', title: "Submission Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeration = async (id: string, status: 'approved' | 'rejected') => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'wiki_entries', id), { status });
      toast({ title: `Article ${status.charAt(0).toUpperCase() + status.slice(1)}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
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

  const handleExportBibliography = (result: any) => {
    if (!result || !result.bibliography) return;
    const blob = new Blob([result.bibliography], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexiverse-bibliography-${Date.now()}.txt`;
    a.click();
    toast({ title: "Bibliography Exported", description: "File downloaded in Zotero-compatible format." });
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSidebarSearch()}
                />
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
                  { id: 'dictionaries', label: t.nav.dictionaries, icon: Type },
                  { id: 'commentaries', label: t.nav.commentaries, icon: Scroll },
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

            {userProfile?.isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} tooltip="Wiki Moderation">
                      <ShieldAlert className="h-5 w-5" /> <span>Wiki Moderation</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
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
                      <DropdownMenuItem onClick={() => setActiveTab('support')}><LifeBuoy className="h-4 w-4 mr-2" /> {t.nav.help}</DropdownMenuItem>
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
                            <div key={h.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => {
                              setActiveTab(h.type as ViewMode);
                              if (h.type === 'lexicon') setStrongsTerm(h.term);
                              if (h.type === 'ai-assistant') setAssistantTerm(h.term);
                            }}>
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
                          {history.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                              <History className="h-8 w-8 opacity-20 mb-2" />
                              <p className="text-xs italic">{t.dashboard.no_history}</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <Files className="h-4 w-4 text-primary" /> {t.dashboard.documents}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[220px]">
                          {recentDocuments.map(doc => (
                            <div key={doc.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{doc.name}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase">{doc.type} • {doc.uploadDate}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('ai-assistant');
                                  setAssistantTerm(doc.name);
                                  toast({ title: "Analyzing Document", description: `Loading ${doc.name} into AI Study Assistant...` });
                                }}>
                                  <FileSearch className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {recentDocuments.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                              <FileUp className="h-8 w-8 opacity-20 mb-2" />
                              <p className="text-xs italic">{t.dashboard.no_documents}</p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" /> Research Lab Features
                        </CardTitle>
                        <CardDescription>Advanced scholarly workflows implemented.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('research-library')}>
                           <Cpu className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Research OCR & Library</p>
                             <p className="text-[10px] text-muted-foreground">Manage papers and extract text from primary source images.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('wiki')}>
                           <Share2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Peer-Reviewed Wiki</p>
                             <p className="text-[10px] text-muted-foreground">Contribute to a curated knowledge base with moderator workflows.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('ai-assistant')}>
                           <Smartphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">AI Contextual Synthesis</p>
                             <p className="text-[10px] text-muted-foreground">AI Assistant now prioritizes and cites your research context.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => setActiveTab('ai-settings')}>
                           <Puzzle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Academic Data Sync</p>
                             <p className="text-[10px] text-muted-foreground">Zotero-ready exports and bibliographic standard formatting.</p>
                           </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-headline">{t.dashboard.stats_title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-muted-foreground">{t.dashboard.wiki_articles}</span>
                          <span className="text-2xl font-bold text-primary font-headline">{approvedWikiEntries.length}</span>
                        </div>
                        <Separator className="bg-primary/10" />
                        <div className="flex justify-between items-end">
                          <span className="text-xs text-muted-foreground">Research Papers</span>
                          <span className="text-2xl font-bold text-primary font-headline">{recentDocuments.length}</span>
                        </div>
                        <div className="pt-2">
                          <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-2/3" />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-1">Scholarly activity high.</p>
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
                      <p className="text-muted-foreground">Manage your scholarly knowledge base and extract primary source data.</p>
                    </div>
                    <div className="flex gap-2">
                       <Label htmlFor="ocr-upload" className="cursor-pointer">
                         <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                           <ScanText className="h-4 w-4" /> AI OCR Extraction
                         </div>
                         <Input id="ocr-upload" type="file" className="hidden" accept="image/*" onChange={handleOCR} />
                       </Label>
                    </div>
                  </header>

                  <div className="grid gap-8 md:grid-cols-3">
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                          <Files className="h-5 w-5 text-primary" /> My Scholarly Papers
                        </CardTitle>
                        <CardDescription>Documents currently linked to your AI research context.</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <div className="space-y-4">
                            {recentDocuments.map(doc => (
                              <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border group hover:border-primary/20 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-muted rounded-lg"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                                  <div>
                                    <p className="font-bold text-sm">{doc.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{doc.type} • Uploaded {doc.uploadDate}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setActiveTab('ai-assistant');
                                    setAssistantTerm(doc.name);
                                  }}><Sparkles className="h-4 w-4 mr-1" /> Analyze</Button>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            ))}
                         </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-headline">AI Extraction Lab</CardTitle>
                        <CardDescription>Status of your multimodal OCR and paleography tasks.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                         {ocrImage && (
                           <div className="space-y-4">
                             <div className="aspect-video bg-muted rounded-lg overflow-hidden border">
                               <img src={ocrImage} alt="OCR Source" className="w-full h-full object-cover" />
                             </div>
                             {isLoading ? (
                               <div className="flex items-center justify-center py-10">
                                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                 <span className="ml-3 text-sm italic">Analyzing paleography...</span>
                               </div>
                             ) : ocrResult && (
                               <div className="space-y-2">
                                 <Label className="text-xs uppercase text-muted-foreground">Extracted Text</Label>
                                 <div className="bg-muted p-3 rounded-lg text-xs leading-relaxed max-h-[200px] overflow-auto">
                                   {ocrResult}
                                 </div>
                                 <Button variant="outline" size="sm" className="w-full" onClick={() => {
                                   const newDoc = {
                                     id: Date.now().toString(),
                                     name: `Extracted Research ${new Date().toLocaleDateString()}.txt`,
                                     type: 'TXT',
                                     uploadDate: new Date().toLocaleDateString(),
                                     content: ocrResult
                                   };
                                   setRecentDocuments([newDoc, ...recentDocuments]);
                                   setOcrResult(null);
                                   setOcrImage(null);
                                   toast({ title: "Paper Added", description: "Transcription saved to Research Library." });
                                 }}><Plus className="h-3 w-3 mr-2" /> Add to Library</Button>
                               </div>
                             )}
                           </div>
                         )}
                         {!ocrImage && (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                              <ScanText className="h-10 w-10 opacity-20 mb-4" />
                              <p className="text-xs text-center italic px-10">Upload images of manuscripts or papers to perform AI text extraction.</p>
                            </div>
                         )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'wiki' && (
                <div className="space-y-6 animate-in fade-in">
                  <header className="flex justify-between items-center">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">{t.nav.wiki}</h1>
                      <p className="text-muted-foreground">Collaborative scholarly articles with peer-review oversight.</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Contribute Article</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-headline">Propose Scholarly Entry</DialogTitle>
                          <DialogDescription>Submit a research-backed article for academic review by the moderating committee.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Article Title</Label>
                            <Input placeholder="e.g., The Semantic Range of Logos in Johannine Literature" value={newWikiTitle} onChange={e => setNewWikiTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Scholarly Content</Label>
                            <Textarea className="min-h-[200px]" placeholder="Detailed academic analysis..." value={newWikiContent} onChange={e => setNewWikiContent(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Works Cited (Primary)</Label>
                              <Textarea placeholder="List major scripture/lexicon refs..." value={newWikiWorksCited} onChange={e => setNewWikiWorksCited(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Full Bibliography (SBL/Turabian)</Label>
                              <Textarea placeholder="Formal citations..." value={newWikiBiblio} onChange={e => setNewWikiBiblio(e.target.value)} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" disabled={isLoading} onClick={() => setNewWikiTitle('')}>Clear</Button>
                          <Button onClick={handleWikiSubmit} disabled={isLoading || !newWikiTitle || !newWikiContent}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Submit for Review
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </header>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search scholarly wiki..." className="pl-10" value={wikiSearch} onChange={e => setWikiSearch(e.target.value)} />
                  </div>

                  <div className="grid gap-6">
                    {approvedWikiEntries.length > 0 ? (
                      approvedWikiEntries.map(entry => (
                        <Card key={entry.id} className="group hover:border-primary/20 transition-all">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="font-headline text-xl text-primary">{entry.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <User className="h-3 w-3" /> By {entry.authorName} • <Calendar className="h-3 w-3" /> {entry.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-200">Peer Reviewed</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{entry.content}</p>
                          </CardContent>
                          <CardFooter className="bg-muted/10 flex justify-between">
                            <Button variant="ghost" size="sm" className="gap-2">Read Full Entry <ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleExportBibliography(entry)}>
                              <FileJson className="h-4 w-4" /> Export Bibliography
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Globe className="h-12 w-12 opacity-20 mb-4" />
                        <p className="text-sm italic">No entries found matching your search. Consider contributing a new article.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'moderation' && userProfile?.isAdmin && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Wiki Moderation</h1>
                    <p className="text-muted-foreground">Review and approve scholarly submissions to maintain academic integrity.</p>
                  </header>

                  <div className="grid gap-6">
                    {pendingWikiEntries.length > 0 ? (
                      pendingWikiEntries.map(entry => (
                        <Card key={entry.id} className="border-amber-200 bg-amber-50/10">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="font-headline text-lg">{entry.title}</CardTitle>
                                <CardDescription>Submitted by {entry.authorName}</CardDescription>
                              </div>
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending Review</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="bg-white/50 p-4 rounded-lg border text-sm italic">
                              {entry.content}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-bold block mb-1">Works Cited</span>
                                <p className="text-muted-foreground">{entry.worksCited}</p>
                              </div>
                              <div>
                                <span className="font-bold block mb-1">Bibliography</span>
                                <p className="text-muted-foreground">{entry.bibliography}</p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="justify-end gap-2 border-t pt-4">
                            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleModeration(entry.id, 'rejected')}>
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleModeration(entry.id, 'approved')}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/20 rounded-xl">
                        <ShieldCheck className="h-12 w-12 opacity-20 mb-4" />
                        <p className="text-sm">Queue is clear. All submissions have been reviewed.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'ai-settings' && (
                <div className="space-y-8 animate-in fade-in pb-10">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">{t.settings.title}</h1>
                    <p className="text-muted-foreground">{t.settings.subtitle}</p>
                  </header>
                  
                  <div className="grid gap-8">
                    <Card className="shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Languages className="h-5 w-5 text-primary" /> {t.settings.interface_prefs}
                        </CardTitle>
                        <CardDescription>{t.settings.interface_desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <Label>{t.settings.language}</Label>
                          <Select 
                            value={aiPrefs.language} 
                            onValueChange={(val) => setAiPrefs({...aiPrefs, language: val})}
                          >
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder="Select language..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLanguages.map(lang => (
                                <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" /> {t.settings.ai_config}
                        </CardTitle>
                        <CardDescription>{t.settings.ai_desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiPrefs.selectedModel === 'googleai/gemini-2.5-flash' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                            onClick={() => setAiPrefs({...aiPrefs, selectedModel: 'googleai/gemini-2.5-flash'})}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold">Gemini 2.5 Flash</span>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600">Free/Optimized</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Optimized for speed. Best for quick linguistic checks and OCR.</p>
                          </div>
                          <div 
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiPrefs.selectedModel === 'googleai/gemini-2.5-pro-001' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                            onClick={() => setAiPrefs({...aiPrefs, selectedModel: 'googleai/gemini-2.5-pro-001'})}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold">Gemini 2.5 Pro</span>
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Advanced tier</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">Maximum reasoning depth. Ideal for complex theological synthesis.</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> {t.settings.api_key}</Label>
                          <Input 
                            type="password" 
                            placeholder="Paste your personal GEMINI_API_KEY here..." 
                            value={aiPrefs.customApiKey} 
                            onChange={e => setAiPrefs({...aiPrefs, customApiKey: e.target.value})}
                            className="max-w-md"
                          />
                          <p className="text-[10px] text-muted-foreground">Your key is stored securely in your profile and used only for your requests.</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" /> {t.settings.scripture_prefs}
                        </CardTitle>
                        <CardDescription>{t.settings.scripture_desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <Label>{t.settings.bible_version}</Label>
                          <Select 
                            value={aiPrefs.preferredBibleVersion} 
                            onValueChange={(val) => setAiPrefs({...aiPrefs, preferredBibleVersion: val})}
                          >
                            <SelectTrigger className="max-w-md">
                              <SelectValue placeholder="Select translation..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableVersions.length > 0 ? (
                                availableVersions.map((v) => (
                                  <SelectItem key={v.id} value={v.id}>{v.name} ({v.abbreviation})</SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="kjv">King James Version (KJV)</SelectItem>
                                  <SelectItem value="net">New English Translation (NET)</SelectItem>
                                  <SelectItem value="web">World English Bible (WEB)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" /> {t.settings.privacy_title}
                        </CardTitle>
                        <CardDescription>{t.settings.privacy_desc}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col gap-4 max-w-md">
                          <Button 
                            variant="outline" 
                            className="justify-start gap-2" 
                            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                          >
                            <Settings className="h-4 w-4" /> {t.settings.manage_cookies}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="justify-start gap-2" 
                            onClick={handleRequestData}
                          >
                            <Download className="h-4 w-4" /> {t.settings.request_data}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" /> {t.settings.delete_account}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <ShieldAlert className="h-5 w-5 text-destructive" />
                                  Confirm Data Erasure
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.settings.delete_confirm}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteAccount}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Proceed with Deletion
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                      <Button size="lg" className="gap-2" onClick={handleSavePreferences} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {t.settings.save}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai-assistant' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">{t.nav.study_assistant}</h1>
                    <p className="text-muted-foreground">Advanced academic synthesis for scripture and theology.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter a biblical term or concept..." 
                          value={assistantTerm} 
                          onChange={e => setAssistantTerm(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
                        />
                        <Button onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {assistantResult && (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl font-headline">{assistantResult.originalWord}</CardTitle>
                          <CardDescription>{assistantResult.transliteration} • {assistantResult.pronunciation}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExportBibliography(assistantResult)}>
                          <Download className="h-4 w-4 mr-2" /> Export Bib
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-bold text-sm uppercase mb-2">Definitions</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {assistantResult.definitions.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm uppercase mb-2">AI Insights & Research Synthesis</h4>
                          <p className="text-sm leading-relaxed">{assistantResult.aiInsights}</p>
                        </div>
                        <Separator />
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-bold text-xs uppercase mb-2">Bibliography</h4>
                          <p className="text-[10px] italic">{assistantResult.bibliography}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                          placeholder="Search Strong's Number (e.g., G3056, H7225)..." 
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
                                <Badge key={c} variant="secondary" className="text-[10px] uppercase">
                                  {c === 'Person' && <User className="h-3 w-3 mr-1" />}
                                  {c === 'Place' && <MapPin className="h-3 w-3 mr-1" />}
                                  {c === 'Event' && <Calendar className="h-3 w-3 mr-1" />}
                                  {c === 'Promise' && <Zap className="h-3 w-3 mr-1" />}
                                  {c === 'Command' && <Hammer className="h-3 w-3 mr-1" />}
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-8 pt-6">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Dictionary Definition</h3>
                          <p className="text-sm leading-relaxed border-l-4 border-primary/20 pl-4 py-1 italic">{lexiconResult.definition}</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <Card className="bg-muted/30 border-none shadow-none">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold flex items-center gap-2"><Scroll className="h-4 w-4" /> Lexical Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{lexiconResult.lexicalData}</p>
                            </CardContent>
                          </Card>
                          <Card className="bg-muted/30 border-none shadow-none">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold flex items-center gap-2"><History className="h-4 w-4" /> Historical Context</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xs text-muted-foreground leading-relaxed">{lexiconResult.historicalConnotations}</p>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> AI Scholarly Synthesis
                          </h3>
                          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-sm leading-relaxed">{lexiconResult.summary}</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Verse Occurrences ({lexiconResult.verseOccurrences.length})
                          </h3>
                          <div className="space-y-4">
                            {lexiconResult.verseOccurrences.map((v, i) => (
                              <Card key={i} className="group hover:border-primary/40 transition-all shadow-sm">
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold font-headline text-primary">{v.reference}</span>
                                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setActiveTab('verse-explorer')}>
                                      Jump to Passage <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p className="text-sm font-serif leading-relaxed italic">&ldquo;{v.text}&rdquo;</p>
                                  <div className="bg-muted p-2 rounded text-[11px] flex items-start gap-2">
                                    <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground"><strong className="text-foreground">Contextual Nuance:</strong> {v.contextualMeaning}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs uppercase mb-2 flex items-center gap-2"><Library className="h-3.5 w-3.5" /> SBL Bibliography</h4>
                            <p className="text-[10px] italic font-serif leading-relaxed">{lexiconResult.bibliography}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleExportBibliography(lexiconResult)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'verse-explorer' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">{t.nav.verse_explorer}</h1>
                    <p className="text-muted-foreground">Interactive exploration of scripture and contexts.</p>
                  </header>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Passage Explorer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Bible Reference (e.g., John 3:16)..." 
                          value={explorerRef} 
                          onChange={e => setExplorerRef(e.target.value)}
                        />
                        <Button variant="secondary" onClick={() => setExplorerChat([...explorerChat, { role: 'user', content: `Analyze ${explorerRef}` }])}>Load</Button>
                      </div>
                      <div className="min-h-[300px] border rounded-lg bg-muted/20 p-4">
                        {explorerChat.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                             <Compass className="h-12 w-12 opacity-20 mb-2" />
                             <p>Enter a passage to begin your interactive research session.</p>
                           </div>
                        ) : (
                          <div className="space-y-4">
                            {explorerChat.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ask a question about this passage..." 
                          value={explorerQuestion} 
                          onChange={e => setExplorerQuestion(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              setExplorerChat([...explorerChat, { role: 'user', content: explorerQuestion }]);
                              setExplorerQuestion('');
                            }
                          }}
                        />
                        <Button onClick={() => {
                          setExplorerChat([...explorerChat, { role: 'user', content: explorerQuestion }]);
                          setExplorerQuestion('');
                        }}><Send className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <footer className="mt-12 pt-8 border-t">
              <div 
                className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => trackAdClick('footer_banner_scholarly', 'footer')}
              >
                <div className="flex flex-col items-center">
                  <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
                  <p className="text-xs text-muted-foreground italic">Partner with LexiVerse Explorer</p>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
                <span>© 2024 {t.app_title}</span>
              </div>
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

