'use client';

import { useState, useEffect, useId, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, where, orderBy, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { logSearch } from '@/lib/search-logging';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

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
  FileText, 
  Mic, 
  Loader2,
  Languages,
  MessageSquare,
  History,
  Send,
  Download,
  Trash2,
  Sun,
  Moon,
  Share2,
  ExternalLink,
  Book,
  Globe,
  Library,
  Zap,
  Quote,
  Scale,
  ClipboardList,
  Edit3,
  Highlighter,
  Plus,
  Copy,
  FileSearch,
  Check,
  FileCode,
  LogOut,
  Table as TableIcon,
  CloudDownload,
  FileWarning,
  SpellCheck,
  AlertCircle,
  Sparkles,
  LayoutDashboard,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Info,
  Type,
  Maximize2,
  Minimize2,
  Volume2,
  ArrowRight,
  Clock,
  File,
  StickyNote,
  ImageIcon,
  Eye,
  Cloud,
  FolderOpen,
  Images as ImagesIcon,
  ScanText,
  Settings,
  Cpu,
  Key,
  Shield,
  Megaphone,
  Network,
  Milestone,
  Map as MapIcon,
  BookMarked,
  LifeBuoy,
  HelpCircle,
  ShieldQuestion,
  UserCheck
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import { useToast } from '@/hooks/use-toast';
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { interactiveVerseExplorationAI } from '@/ai/flows/interactive-verse-exploration-ai';
import { refineWriting, type WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { formatBibliography, type FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';
import { checkIntegrity, type AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { extractTextFromImage } from '@/ai/flows/ocr-flow';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { searchCommentariesForContext, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';
import { getVersions, getChapterContent, parseReference, type BibleVersion, type BibleChapter } from '@/lib/bible-api';
import { trackAdClick } from '@/components/analytics';

type ViewMode = 'dashboard' | 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers' | 'gallery' | 'writing-assistant' | 'integrity' | 'ai-settings' | 'theology-map' | 'timeline' | 'maps' | 'wiki' | 'support';

interface Note {
  id: string;
  content: string;
  source: string;
  date: string;
  driveFileId?: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  content: string;
  format: 'txt' | 'pdf' | 'docx' | 'gdoc' | 'gsheet' | 'png' | 'jpg' | 'jpeg' | 'webp';
  author?: string;
  date: string;
  driveFileId?: string;
  extractedText?: string;
}

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
  isAdmin?: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  
  const [aiPrefs, setAiPrefs] = useState({
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: ''
  });

  const [strongsTerm, setStrongsTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [dictTerm, setDictTerm] = useState('');
  const [dictResult, setDictResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [commWord, setCommWord] = useState('');
  const [commLanguage, setCommLanguage] = useState('Greek');
  const [commResult, setCommResult] = useState<SearchCommentariesOutput | null>(null);
  const [passageRef, setPassageRef] = useState('John 1');
  const [readingVersion, setReadingVersion] = useState('kjv');
  const [currentPassage, setCurrentPassage] = useState<BibleChapter | null>(null);
  const [writingInput, setWritingInput] = useState('');
  const [writingResult, setWritingResult] = useState<WritingAssistantOutput | null>(null);
  const [integrityInput, setIntegrityInput] = useState('');
  const [integrityResult, setIntegrityResult] = useState<AcademicIntegrityOutput | null>(null);
  const [theoConcept, setTheoConcept] = useState('');
  const [theoResult, setTheoResult] = useState<TheologicalConceptOutput | null>(null);
  const [timelineTopic, setTimelineTopic] = useState('');
  const [timelineResult, setTimelineResult] = useState<HistoricalTimelineOutput | null>(null);

  // Wiki States
  const [newWikiTitle, setNewWikiTitle] = useState('');
  const [newWikiContent, setNewWikiContent] = useState('');
  const [newWikiWorksCited, setNewWikiWorksCited] = useState('');
  const [newWikiBiblio, setNewWikiBiblio] = useState('');
  const [wikiSearch, setWikiSearch] = useState('');

  // Firestore Collections for Wiki
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
    const savedNotes = localStorage.getItem('lexiverse_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedPapers = localStorage.getItem('lexiverse_papers');
    if (savedPapers) setResearchPapers(JSON.parse(savedPapers));
    getVersions().then(setVersions);
  }, []);

  useEffect(() => {
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile(data as UserProfile);
          if (data.aiPreferences) setAiPrefs(data.aiPreferences);
        }
      });
      return () => unsub();
    }
  }, [user, db]);

  const [versions, setVersions] = useState<BibleVersion[]>([]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      setDoc(userRef, { uid: result.user.uid, displayName: result.user.displayName, email: result.user.email }, { merge: true });
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

  const handleLexiconSearch = async () => {
    if (!strongsTerm.trim()) return;
    setIsLoading(true);
    logSearch(db, strongsTerm, 'lexicon', user?.uid);
    try {
      const result = await defineAndAnalyzeTerm({ strongsNumber: strongsTerm, model: aiPrefs.selectedModel });
      setLexiconResult(result);
      const newHistory = [{id: Date.now().toString(), type: 'Lexicon', term: strongsTerm, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lexicon search failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDictionarySearch = async () => {
    if (!dictTerm.trim()) return;
    setIsLoading(true);
    logSearch(db, dictTerm, 'dictionary', user?.uid);
    try {
      const result = await defineAndAnalyzeTerm({ strongsNumber: dictTerm, model: aiPrefs.selectedModel });
      setDictResult(result);
      const newHistory = [{id: Date.now().toString(), type: 'Dictionary', term: dictTerm, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Dictionary search failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentarySearch = async () => {
    if (!commWord.trim()) return;
    setIsLoading(true);
    logSearch(db, commWord, 'commentary', user?.uid);
    try {
      const result = await searchCommentariesForContext({ word: commWord, language: commLanguage, model: aiPrefs.selectedModel });
      setCommResult(result);
      const newHistory = [{id: Date.now().toString(), type: 'Commentary', term: commWord, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Commentary search failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTheologyMap = async () => {
    if (!theoConcept.trim()) return;
    setIsLoading(true);
    logSearch(db, theoConcept, 'theology', user?.uid);
    try {
      const result = await analyzeTheologicalConcept({ concept: theoConcept });
      setTheoResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Theology mapping failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPassage = async () => {
    setIsLoading(true);
    logSearch(db, passageRef, 'scripture', user?.uid);
    const parsed = parseReference(passageRef);
    if (!parsed) {
      toast({ variant: 'destructive', title: 'Invalid Reference' });
      setIsLoading(false);
      return;
    }
    const content = await getChapterContent(readingVersion, parsed.bookName, parsed.chapter);
    if (content) {
      setCurrentPassage(content);
      const newHistory = [{id: Date.now().toString(), type: 'Scripture', term: passageRef, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory));
    } else {
      toast({ variant: 'destructive', title: 'Passage not found' });
    }
    setIsLoading(false);
  };

  const handleCreateWikiEntry = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Login Required' }); return; }
    if (!newWikiTitle.trim() || !newWikiContent.trim() || !newWikiWorksCited.trim() || !newWikiBiblio.trim()) {
      toast({ variant: 'destructive', title: 'Incomplete Fields', description: 'Scholarly wiki entries require full citations and bibliographies.' });
      return;
    }
    setIsLoading(true);
    try {
      addDoc(collection(db, 'wiki_entries'), {
        title: newWikiTitle,
        content: newWikiContent,
        worksCited: newWikiWorksCited,
        bibliography: newWikiBiblio,
        status: 'pending',
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: new Date().toISOString()
      });
      toast({ title: 'Submitted for Review', description: 'A moderator will review your entry before it goes live.' });
      setNewWikiTitle(''); setNewWikiContent(''); setNewWikiWorksCited(''); setNewWikiBiblio('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWiki = async (id: string) => {
    if (!userProfile?.isAdmin) return;
    updateDoc(doc(db, 'wiki_entries', id), { status: 'approved' });
    toast({ title: 'Entry Approved' });
  };

  const handleRejectWiki = async (id: string) => {
    if (!userProfile?.isAdmin) return;
    updateDoc(doc(db, 'wiki_entries', id), { status: 'rejected' });
    toast({ title: 'Entry Rejected' });
  };

  const handleAdClick = (id: string, position: string) => {
    trackAdClick(id, position);
  };

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md"><Globe className="h-6 w-6" /></div>
              <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">LexiVerse</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard">
                    <LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>Library & Research</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'bibles', label: 'Bible Reader', icon: Book },
                  { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
                  { id: 'dictionaries', label: 'Dictionaries', icon: Type },
                  { id: 'commentaries', label: 'Commentaries', icon: Scroll },
                  { id: 'wiki', label: 'Scholarly Wiki', icon: Globe },
                  { id: 'papers', label: 'My Papers', icon: Library },
                  { id: 'gallery', label: 'Gallery', icon: ImagesIcon },
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
              <SidebarGroupLabel>Scholar AI Tools</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'scholar-ai', label: 'Scholar Chat', icon: MessageSquare },
                  { id: 'theology-map', label: 'Theology Map', icon: Network },
                  { id: 'timeline', label: 'Timeline', icon: Milestone },
                  { id: 'writing-assistant', label: 'Writing Editor', icon: Edit3 },
                  { id: 'integrity', label: 'Academic Integrity', icon: ShieldCheck },
                  { id: 'notes', label: 'Research Notes', icon: Scroll },
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
              <SidebarGroupLabel>Configuration</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'ai-settings'} onClick={() => setActiveTab('ai-settings')} tooltip="AI Configuration">
                    <Cpu className="h-5 w-5" /> <span>AI Engine</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'support'} onClick={() => setActiveTab('support')} tooltip="Support Center">
                    <LifeBuoy className="h-5 w-5" /> <span>Help & Support</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4 border-t pt-4">
              <SidebarGroupLabel>Scholar Support</SidebarGroupLabel>
              <div className="px-2 py-1">
                <div className="bg-muted/30 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer group" onClick={() => handleAdClick('scholar_support', 'sidebar')}>
                   <Megaphone className="h-4 w-4 mx-auto mb-1 opacity-40 group-hover:text-primary" />
                   <p className="text-[10px] text-muted-foreground italic">Highlight your scholarly resource</p>
                </div>
              </div>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t flex flex-row items-center justify-between">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                    <img src={user.photoURL || ''} alt="" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                  {userProfile?.isAdmin && <DropdownMenuItem disabled><ShieldCheck className="h-4 w-4 mr-2" /> Administrator</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLogin}>Link Google</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="container max-w-6xl mx-auto py-8 px-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold font-headline">Scholarly Workspace</h1>
                  <p className="text-muted-foreground text-lg">LexiVerse AI and Biblical Research Suite.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardDescription>Recent Searches</CardDescription>
                      <CardTitle className="text-3xl">{history.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20">
                    <CardHeader className="pb-2">
                      <CardDescription>Library Papers</CardDescription>
                      <CardTitle className="text-3xl">{researchPapers.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardDescription>Wiki Articles</CardDescription>
                      <CardTitle className="text-3xl">{approvedWikiEntries.length}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20">
                    <CardHeader className="pb-2">
                      <CardDescription>Research Notes</CardDescription>
                      <CardTitle className="text-3xl">{notes.length}</CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <Card 
                      className="bg-muted/10 border-dashed border-2 flex flex-col items-center justify-center p-6 transition-all hover:bg-muted/20 cursor-pointer group"
                      onClick={() => handleAdClick('dashboard_spotlight', 'dashboard')}
                    >
                      <div className="flex items-center gap-3">
                        <Megaphone className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <div className="text-left space-y-0.5">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Spotlight</span>
                          <p className="text-sm italic text-muted-foreground font-headline">Support academic research by sponsoring LexiVerse.</p>
                        </div>
                      </div>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-xl font-headline">Quick Library Access</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {researchPapers.slice(0, 4).map(p => (
                            <div key={p.id} className="flex items-center p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab('papers')}>
                              <FileText className="h-4 w-4 mr-3 text-primary" />
                              <span className="text-sm font-medium truncate">{p.title}</span>
                            </div>
                          ))}
                          {researchPapers.length === 0 && <p className="text-sm text-muted-foreground italic col-span-2 text-center py-8">No research papers in your library.</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader><CardTitle className="text-xl font-headline">Search History</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                        {history.map(h => (
                          <div key={h.id} className="p-4 border-b hover:bg-muted/50 cursor-pointer flex justify-between items-center group">
                            <div>
                              <p className="text-sm font-bold font-headline">{h.term}</p>
                              <p className="text-[10px] text-muted-foreground">{h.type} • {h.date}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        ))}
                        {history.length === 0 && <p className="p-4 text-xs text-muted-foreground text-center">No recent searches.</p>}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'wiki' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scholarly Wiki</h1>
                    <p className="text-muted-foreground">Collaborative knowledge base for biblical and theological research.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Input placeholder="Search wiki..." className="max-w-xs" value={wikiSearch} onChange={e => setWikiSearch(e.target.value)} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Contribute</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>New Scholarly Wiki Entry</DialogTitle>
                          <DialogDescription>Submit a research-backed entry. All submissions require Works Cited and Full Bibliography.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Article Title</Label>
                            <Input placeholder="e.g. The Eschatology of the Johannine Community" value={newWikiTitle} onChange={e => setNewWikiTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Content</Label>
                            <Textarea placeholder="Main article body..." className="min-h-[200px]" value={newWikiContent} onChange={e => setNewWikiContent(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Works Cited (Inline references)</Label>
                              <Textarea placeholder="List sources cited in text..." className="min-h-[100px]" value={newWikiWorksCited} onChange={e => setNewWikiWorksCited(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Full Bibliography (SBL/Chicago)</Label>
                              <Textarea placeholder="Complete academic bibliography..." className="min-h-[100px]" value={newWikiBiblio} onChange={e => setNewWikiBiblio(e.target.value)} />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCreateWikiEntry} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Submit for Peer Review
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-4">
                  <div className="lg:col-span-3 space-y-6">
                    {approvedWikiEntries.length > 0 ? (
                      approvedWikiEntries.map(entry => (
                        <Card key={entry.id} className="overflow-hidden">
                          <CardHeader className="bg-primary/5">
                            <CardTitle className="font-headline text-2xl text-primary">{entry.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <UserCheck className="h-3 w-3" /> Contributed by {entry.authorName} • {new Date(entry.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-6">
                            <div className="prose dark:prose-invert max-w-none leading-relaxed font-serif text-lg whitespace-pre-wrap">
                              {entry.content}
                            </div>
                            <Separator />
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Works Cited</h4>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{entry.worksCited}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Bibliography</h4>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{entry.bibliography}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="py-20 text-center text-muted-foreground opacity-30 border-2 border-dashed rounded-xl">
                        <Globe className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-headline">No wiki entries found.</p>
                        <p className="text-sm">Be the first to contribute scholarly knowledge.</p>
                      </div>
                    )}
                  </div>

                  {userProfile?.isAdmin && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600"><ShieldQuestion className="h-4 w-4" /> Pending Moderation</h3>
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="space-y-4">
                          {pendingWikiEntries.map(pending => (
                            <Card key={pending.id} className="border-amber-200 bg-amber-50/10">
                              <CardHeader className="p-4">
                                <CardTitle className="text-sm font-bold">{pending.title}</CardTitle>
                                <CardDescription className="text-[10px]">By {pending.authorName}</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-[10px] line-clamp-3 mb-4">{pending.content}</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="default" className="flex-1 text-[10px] h-7" onClick={() => handleApproveWiki(pending.id)}>Approve</Button>
                                  <Button size="sm" variant="destructive" className="flex-1 text-[10px] h-7" onClick={() => handleRejectWiki(pending.id)}>Reject</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {pendingWikiEntries.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-8">No pending submissions.</p>}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-8 animate-in fade-in">
                <header>
                  <h1 className="text-3xl font-bold font-headline">Help & Support</h1>
                  <p className="text-muted-foreground">Technical assistance and scholarship resources.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> osTicket Integration</CardTitle>
                      <CardDescription>Submit a technical support ticket directly to our dean's office.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input placeholder="e.g. Issue with Lexicon search" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Please provide details about the issue..." />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Create Ticket via osTicket</Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Documentation</CardTitle>
                      <CardDescription>Learn how to use LexiVerse AI tools effectively.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm">Scholar AI Best Practices</h4>
                        <p className="text-xs text-muted-foreground">Learn how to prompt the AI for better theological synthesis and original language analysis.</p>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm">Wiki.js Integration</h4>
                        <p className="text-xs text-muted-foreground">Access our external Wiki.js instance for community-maintained bibliographies and course notes.</p>
                        <Button variant="outline" size="sm" className="w-full gap-2"><ExternalLink className="h-4 w-4" /> Open Wiki.js</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Global Footer Banner Ad */}
            <div className="mt-12 pt-8 border-t">
              <div 
                className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleAdClick('footer_banner_scholarly', 'footer')}
              >
                <div className="flex flex-col items-center">
                  <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
                  <p className="text-xs text-muted-foreground italic">Partner with LexiVerse Explorer</p>
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
