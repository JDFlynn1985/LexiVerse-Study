'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';

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
  Volume2
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  DialogFooter
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
import { getVersions, getChapterContent, parseReference, type BibleVersion, type BibleChapter } from '@/lib/bible-api';

type ViewMode = 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers' | 'writing-assistant' | 'integrity';

interface Note {
  id: string;
  content: string;
  source: string;
  date: string;
}

interface BiblioItem {
  id: string;
  citation: string;
  sourceType: string;
  date: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  content: string;
  format: 'txt' | 'pdf' | 'docx' | 'gdoc' | 'gsheet';
  author?: string;
  date: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('bibles');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [biblioItems, setBiblioItems] = useState<BiblioItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  
  // Lexicon Search
  const [strongsTerm, setStrongsTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);

  // Translation Comparison
  const [transWord, setTransWord] = useState('');
  const [transResult, setTransResult] = useState<CompareTranslationsOutput | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['kjv', 'net']);

  // Bible Reading
  const [currentPassage, setCurrentPassage] = useState<BibleChapter | null>(null);
  const [passageRef, setPassageRef] = useState('John 1');
  const [readingVersion, setReadingVersion] = useState('kjv');

  // Scholar AI
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);

  // Writing Assistant States
  const [writingInput, setWritingInput] = useState('');
  const [writingResult, setWritingResult] = useState<WritingAssistantOutput | null>(null);

  // Bibliography States
  const [biblioStyle, setBiblioStyle] = useState<'SBL' | 'Turabian' | 'Chicago' | 'APA' | 'MLA'>('SBL');
  const [formattedBiblioResult, setFormattedBiblioResult] = useState<FormatBibliographyOutput | null>(null);
  const [activeCitation, setActiveCitation] = useState<{ type: 'footnote' | 'inline', text: string } | null>(null);

  // Integrity States
  const [integrityInput, setIntegrityInput] = useState('');
  const [integrityResult, setIntegrityResult] = useState<AcademicIntegrityOutput | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedNotes = localStorage.getItem('lexiverse_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    const savedBiblio = localStorage.getItem('lexiverse_biblio');
    if (savedBiblio) setBiblioItems(JSON.parse(savedBiblio));
    const savedPapers = localStorage.getItem('lexiverse_papers');
    if (savedPapers) setResearchPapers(JSON.parse(savedPapers));
    getVersions().then(setVersions);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setGoogleAccessToken(credential?.accessToken || null);
      const userRef = doc(db, 'users', result.user.uid);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      setDoc(userRef, userData, { merge: true });
      toast({ title: "Logged in", description: `Welcome back, ${result.user.displayName}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGoogleAccessToken(null);
    toast({ title: "Logged out" });
  };

  const handleSaveNote = (content: string, source: string = "Selection") => {
    if (!content.trim()) return;
    const newNote = { id: Date.now().toString(), content: content.trim(), source, date: new Date().toLocaleString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('lexiverse_notes', JSON.stringify(updated));
    toast({ title: "Note Saved", description: "Text added to your personal research notes." });
  };

  const handleSaveToBiblio = (citation: string, type: string = "Research Source") => {
    if (!citation.trim()) return;
    const newItem = { id: Date.now().toString(), citation: citation.trim(), sourceType: type, date: new Date().toLocaleString() };
    const updated = [newItem, ...biblioItems];
    setBiblioItems(updated);
    localStorage.setItem('lexiverse_biblio', JSON.stringify(updated));
    toast({ title: "Citation Added", description: "Source added to your academic bibliography." });
  };

  const handleLexiconSearch = async () => {
    if (!strongsTerm.trim()) return;
    setIsLoading(true);
    try {
      const result = await defineAndAnalyzeTerm({ strongsNumber: strongsTerm });
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

  const handleTranslationComparison = async () => {
    if (!transWord.trim()) return;
    setIsLoading(true);
    try {
      const result = await compareTranslations({ 
        word: transWord, 
        language: 'Greek/Hebrew', 
        versions: selectedVersions 
      });
      setTransResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Comparison failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPassage = async () => {
    setIsLoading(true);
    const parsed = parseReference(passageRef);
    if (!parsed) {
      toast({ variant: 'destructive', title: 'Invalid Reference', description: 'Try "John 3" or "Genesis 1:1"' });
      setIsLoading(false);
      return;
    }
    const content = await getChapterContent(readingVersion, parsed.bookName, parsed.chapter);
    if (content) {
      setCurrentPassage(content);
    } else {
      toast({ variant: 'destructive', title: 'Passage not found' });
    }
    setIsLoading(false);
  };

  const handleScholarChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { role: 'user' as const, content: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsLoading(true);

    try {
      const result = await interactiveVerseExplorationAI({
        term: strongsTerm || 'Bible Study',
        question: chatInput,
        history: chatHistory,
        researchContext: researchPapers.map(p => p.content).slice(0, 3) // Limiting context for prompt size
      });
      setChatHistory(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Scholar AI Error' });
    } finally {
      setIsLoading(false);
    }
  };

  async function handleBiblioFormatting() {
    if (biblioItems.length === 0) return;
    setIsLoading(true);
    try {
      const data = await formatBibliography({ items: biblioItems.map(item => item.citation), style: biblioStyle, formatType: 'bibliography' });
      setFormattedBiblioResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Formatting Failed' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWritingRefinement() {
    if (!writingInput.trim()) return;
    setIsLoading(true);
    try {
      const data = await refineWriting({ text: writingInput, mode: 'academic' });
      setWritingResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Refinement Failed' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleIntegrityScan() {
    if (!integrityInput.trim()) return;
    setIsLoading(true);
    try {
      const data = await checkIntegrity({ text: integrityInput, style: biblioStyle, researchContext: researchPapers.map(p => p.content) });
      setIntegrityResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Scan Failed' });
    } finally {
      setIsLoading(false);
    }
  }

  const captureSelectionToNotes = () => {
    const selection = window.getSelection()?.toString();
    if (selection) handleSaveNote(selection, "Manual Study Capture");
    else toast({ variant: "destructive", title: "No Text Selected", description: "Highlight text first." });
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
              <SidebarGroupLabel>Library & Research</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'bibles', label: 'Bible Reader', icon: Book },
                  { id: 'lexicon', label: 'Advanced Lexicon', icon: BookOpen },
                  { id: 'translations', label: 'Parallel Versions', icon: Scale },
                  { id: 'papers', label: 'My Library', icon: Library },
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
              <SidebarGroupLabel>Scholar AI Engine</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'scholar-ai', label: 'Scholar Chat', icon: MessageSquare },
                  { id: 'writing-assistant', label: 'Writing Editor', icon: Edit3 },
                  { id: 'integrity', label: 'Academic Integrity', icon: ShieldCheck },
                  { id: 'bibliography', label: 'Citations', icon: ClipboardList },
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
          </SidebarContent>
          <SidebarFooter className="p-4 border-t gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2 py-6">
                    <img src={user.photoURL || ''} className="h-8 w-8 rounded-full border mr-3" alt="" />
                    <span className="text-sm font-semibold truncate group-data-[collapsible=icon]:hidden">{user.displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogin}>
                <Globe className="h-4 w-4" /> <span className="group-data-[collapsible=icon]:hidden">Link Google</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 ml-auto" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="fixed top-4 right-8 z-50 flex gap-2">
            <Button variant="secondary" className="shadow-lg h-10 border" onClick={captureSelectionToNotes}>
              <Highlighter className="h-4 w-4 mr-2" /> Capture Highlight
            </Button>
          </div>

          <main className="container max-w-5xl mx-auto py-10 px-6">
            {activeTab === 'bibles' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scripture Reader</h1>
                    <p className="text-muted-foreground">High-performance digital library access.</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Select value={readingVersion} onValueChange={setReadingVersion}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {versions.map(v => <SelectItem key={v.id} value={v.id}>{v.abbreviation}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="e.g. John 3" 
                      className="w-full md:w-40" 
                      value={passageRef} 
                      onChange={(e) => setPassageRef(e.target.value)} 
                    />
                    <Button onClick={loadPassage} disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </header>

                <Card className="min-h-[600px] shadow-lg">
                  <CardContent className="p-10">
                    {currentPassage ? (
                      <div className="space-y-8 max-w-2xl mx-auto">
                        <h2 className="text-4xl font-bold font-headline text-center mb-10">{currentPassage.bookName} {currentPassage.chapterNumber}</h2>
                        <div className="prose dark:prose-invert max-w-none font-serif text-xl leading-relaxed">
                          {currentPassage.content.map((node, i) => (
                            <span key={i} className="group relative inline cursor-text hover:bg-primary/5 rounded transition-colors px-0.5">
                              {node.type === 'verse' && <sup className="text-primary font-bold mr-1 text-sm">{node.number}</sup>}
                              {node.text}
                              {node.content && node.content.map((c: any, ci: number) => (
                                <span key={ci} className={c.type === 'line_break' ? 'block my-4' : ''}>
                                  {c.text}
                                </span>
                              ))}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground opacity-30 text-center space-y-4">
                        <Book className="h-20 w-20" />
                        <p className="text-lg">Select a version and passage to begin your study.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'lexicon' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">Advanced Lexicon</h1>
                  <p className="text-muted-foreground">Original language analysis with Strong's semantic tracing.</p>
                </header>
                
                <div className="flex gap-4 max-w-md mx-auto">
                  <Input 
                    placeholder="Enter Strong's (e.g. G2424, H1254)" 
                    value={strongsTerm} 
                    onChange={(e) => setStrongsTerm(e.target.value)} 
                  />
                  <Button onClick={handleLexiconSearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                  </Button>
                </div>

                {lexiconResult && (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-xl border-primary/20">
                      <CardHeader className="bg-primary/5">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-4xl font-bold font-headline text-primary">{lexiconResult.originalWord}</CardTitle>
                            <CardDescription className="text-lg mt-1 italic">{lexiconResult.transliteration} • [{lexiconResult.pronunciation}]</CardDescription>
                          </div>
                          <Badge variant="outline" className="text-lg py-1 px-3 border-primary/50 text-primary">{lexiconResult.searchStrongNumber}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Library className="h-4 w-4" /> Definitions & Semantic Range
                          </h4>
                          <div className="space-y-3">
                            {lexiconResult.definitions.map((def, i) => (
                              <p key={i} className="text-lg leading-relaxed font-serif">{def}</p>
                            ))}
                          </div>
                        </div>
                        
                        <Separator />

                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" /> Scholar AI Synthesis
                          </h4>
                          <p className="text-sm leading-relaxed text-muted-foreground">{lexiconResult.summary}</p>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg border italic text-xs">
                          {lexiconResult.bibliography}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Quote className="h-4 w-4" /> Scriptural Usage</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {lexiconResult.scriptureReferences.map((ref, i) => (
                            <Button key={i} variant="ghost" size="sm" className="w-full justify-start font-mono text-xs" onClick={() => {setPassageRef(ref); setActiveTab('bibles');}}>
                              <ChevronRight className="h-3 w-3 mr-2" /> {ref}
                            </Button>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="bg-accent/10 border-accent/20">
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-accent-foreground"><Zap className="h-4 w-4" /> Root Analysis</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {lexiconResult.roots?.map((root, i) => (
                            <div key={i} className="space-y-1">
                              <p className="text-sm font-bold text-accent-foreground">{root.root}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{root.definition}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'translations' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">Parallel Comparison</h1>
                  <p className="text-muted-foreground">Compare translation philosophies and linguistic nuances side-by-side.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto items-end">
                  <div className="space-y-2">
                    <Label>Word or Passage</Label>
                    <Input value={transWord} onChange={e => setTransWord(e.target.value)} placeholder="e.g. Logos, John 1:1" />
                  </div>
                  <Button onClick={handleTranslationComparison} disabled={isLoading} className="h-10">
                    Compare Versions
                  </Button>
                </div>

                {transResult && (
                  <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {transResult.translations.map((t, i) => (
                        <Card key={i} className="relative overflow-hidden group">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg font-bold">{t.version}</CardTitle>
                              <Badge variant="secondary" className="text-[10px]">{t.transliteration}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xl font-serif leading-relaxed mb-4">"{t.translation}"</p>
                            {t.notes && <p className="text-xs text-muted-foreground italic border-t pt-2">{t.notes}</p>}
                          </CardContent>
                          <CardFooter>
                            <Button variant="ghost" size="sm" className="w-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleSaveNote(`${t.version}: ${t.translation}`, `Comparison: ${transWord}`)}>
                              <Plus className="h-3 w-3 mr-1" /> Save Note
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                    
                    <Card className="bg-primary/5 border-dashed">
                      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4" /> Comparative Synthesis</CardTitle></CardHeader>
                      <CardContent><p className="text-sm leading-relaxed">{transResult.summary}</p></CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scholar-ai' && (
              <div className="h-[calc(100vh-160px)] flex flex-col animate-in fade-in">
                <header className="border-b pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scholar AI Chat</h1>
                    <p className="text-muted-foreground text-sm">Synthetic analysis across scripture, lexicons, and your research library.</p>
                  </div>
                  {researchPapers.length > 0 && <Badge variant="secondary" className="gap-1"><FileCode className="h-3 w-3" /> {researchPapers.length} Papers in Context</Badge>}
                </header>

                <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl relative bg-card/50">
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6 max-w-3xl mx-auto py-4">
                      {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 mt-20">
                          <div className="bg-primary/10 p-4 rounded-full"><Sparkles className="h-10 w-10 text-primary" /></div>
                          <p className="max-w-xs text-sm">Ask about eschatology, semantic ranges, or how your research papers align with historical commentaries.</p>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                            msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-br-none' 
                              : 'bg-muted border rounded-bl-none font-serif leading-relaxed'
                          }`}>
                            <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted p-4 rounded-2xl border rounded-bl-none flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs font-bold animate-pulse">Consulting scholarly records...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <form onSubmit={handleScholarChat} className="p-4 border-t bg-background/80 backdrop-blur flex gap-2">
                    <Input 
                      placeholder="Ask the Scholar AI..." 
                      className="h-12 text-lg shadow-inner bg-card"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="h-12 w-12 rounded-full shadow-lg" disabled={isLoading || !chatInput.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </Card>
              </div>
            )}

            {/* Other tabs follow same patterns as before */}
            {activeTab === 'notes' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Research Notes</h1>
                    <p className="text-muted-foreground">Captured fragments and study reflections.</p>
                  </div>
                  <Button variant="outline" onClick={() => exportToGoogleDocs('Study Notes', notes.map(n => `Source: ${n.source}\n${n.content}\n---`).join('\n'))}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Export to Docs
                  </Button>
                </header>
                <div className="grid gap-4 md:grid-cols-2">
                  {notes.map(note => (
                    <Card key={note.id} className="relative group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[10px]">{note.source}</Badge>
                          <span className="text-[10px] text-muted-foreground">{note.date}</span>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-sm font-serif line-clamp-6">{note.content}</p></CardContent>
                      <CardFooter className="justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setNotes(notes.filter(n => n.id !== note.id))}><Trash2 className="h-4 w-4" /></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bibliography' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div><h1 className="text-3xl font-bold font-headline">Academic Citation Manager</h1><p className="text-muted-foreground">Generate bibliographies, footnotes, and inline references.</p></div>
                  <div className="flex gap-2">
                    <Select value={biblioStyle} onValueChange={(val: any) => setBiblioStyle(val)}>
                      <SelectTrigger className="w-[180px]"><SelectValue placeholder="Style" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SBL">SBL (Biblical Studies)</SelectItem>
                        <SelectItem value="Chicago">Chicago</SelectItem>
                        <SelectItem value="Turabian">Turabian</SelectItem>
                        <SelectItem value="APA">APA</SelectItem>
                        <SelectItem value="MLA">MLA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBiblioFormatting} disabled={isLoading || biblioItems.length === 0}><FileCheck className="h-4 w-4 mr-2" /> Generate Bib</Button>
                  </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[1fr,350px]">
                  <div className="space-y-6">
                    {formattedBiblioResult ? (
                      <Card className="shadow-lg border-primary/20">
                        <CardHeader className="bg-primary/5 border-b flex justify-between items-center flex-row">
                          <CardTitle className="text-lg">Formatted Bibliography</CardTitle>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => exportToGoogleDocs(`Bib (${biblioStyle})`, formattedBiblioResult.formattedOutput)}>Export</Button>
                            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(formattedBiblioResult.formattedOutput); toast({ title: "Copied" }); }}><Copy className="h-4 w-4" /></Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8"><p className="whitespace-pre-wrap font-serif text-lg leading-loose">{formattedBiblioResult.formattedOutput}</p></CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold font-headline">Study Resources</h2>
                        {biblioItems.length === 0 ? <Card className="py-20 text-center"><ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-10" /><p className="text-muted-foreground">No citations collected.</p></Card> : (
                          <div className="grid gap-3">
                            {biblioItems.map(item => (
                              <Card key={item.id} className="group">
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div className="space-y-1">
                                    <Badge variant="secondary" className="text-[10px] mb-1">{item.sourceType}</Badge>
                                    <p className="text-sm font-medium">{item.citation}</p>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setBiblioItems(biblioItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <aside>
                    <Card className="bg-muted/10">
                      <CardHeader><CardTitle className="text-sm">Style Guide Info</CardTitle></CardHeader>
                      <CardContent className="text-xs space-y-3">
                        <p><strong>SBL 2nd Edition</strong> is preferred for theological papers, requiring specific footnote structures for ancient texts.</p>
                        <p><strong>Turabian</strong> is standard for postgraduate divinity degrees.</p>
                      </CardContent>
                    </Card>
                  </aside>
                </div>
              </div>
            )}

            {activeTab === 'papers' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Research Library</h1>
                    <p className="text-muted-foreground">Your custom knowledge base for the Scholar AI.</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Plus className="h-4 w-4 mr-2" /> Add Paper</Button>
                  </div>
                </header>
                <div className="grid gap-4 md:grid-cols-3">
                  {researchPapers.map(paper => (
                    <Card key={paper.id} className="group overflow-hidden">
                      <div className={`h-1 w-full ${paper.format === 'pdf' ? 'bg-red-500' : paper.format === 'docx' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-bold line-clamp-1">{paper.title}</CardTitle>
                          <Badge variant="secondary" className="text-[8px] uppercase">{paper.format}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-[10px] text-muted-foreground line-clamp-3 italic">Uploaded on {paper.date}</p></CardContent>
                      <CardFooter className="justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSaveNote(paper.content, `Paper: ${paper.title}`)}><Copy className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setResearchPapers(researchPapers.filter(p => p.id !== paper.id))}><Trash2 className="h-3 w-3" /></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'writing-assistant' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center">
                  <h1 className="text-3xl font-bold font-headline">Scholar Writing AI</h1>
                  <p className="text-muted-foreground">Refine your theological drafts and incorporate citations.</p>
                </header>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label>Research Draft</Label>
                    <Textarea 
                      placeholder="Paste your draft here..." 
                      className="min-h-[450px] leading-relaxed" 
                      value={writingInput} 
                      onChange={(e) => setWritingInput(e.target.value)} 
                    />
                    <Button className="w-full h-12" onClick={handleWritingRefinement} disabled={isLoading}><Sparkles className="h-5 w-5 mr-2" /> Refine Draft</Button>
                  </div>
                  <div className="space-y-4">
                    <Label>Scholar AI Refinement</Label>
                    <Card className="min-h-[450px] bg-muted/5 p-6 overflow-hidden">
                      <ScrollArea className="h-full">
                        {writingResult ? (
                          <div className="space-y-6">
                            <p className="text-lg leading-relaxed">{writingResult.improvedText}</p>
                            <div className="border-t pt-4 space-y-3">
                              <h4 className="text-sm font-bold flex items-center gap-2"><Info className="h-4 w-4" /> Academic Notes</h4>
                              {writingResult.suggestions.map((s, i) => <p key={i} className="text-xs text-muted-foreground leading-normal">• {s}</p>)}
                            </div>
                          </div>
                        ) : <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30"><Type className="h-12 w-12 mb-2" /><p>AI output will appear here.</p></div>}
                      </ScrollArea>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrity' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center"><h1 className="text-3xl font-bold font-headline">Integrity & Citation Scanner</h1><p className="text-muted-foreground">Ensure scholarly attribution and check against common sources.</p></header>
                <div className="grid gap-6 md:grid-cols-[1fr,350px]">
                  <div className="space-y-4">
                    <Textarea placeholder="Paste text to scan for attribution errors..." className="min-h-[450px]" value={integrityInput} onChange={(e) => setIntegrityInput(e.target.value)} />
                    <Button className="w-full h-12" onClick={handleIntegrityScan} disabled={isLoading}><ShieldCheck className="h-5 w-5 mr-2" /> Run Integrity Scan</Button>
                  </div>
                  <ScrollArea className="h-[550px]">
                    {integrityResult ? (
                      <div className="space-y-4">
                        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex justify-between items-center">Scan Result <Badge>{integrityResult.integrityScore}%</Badge></CardTitle></CardHeader><CardContent><p className="text-xs">{integrityResult.analysisSummary}</p></CardContent></Card>
                        {integrityResult.findings.map((f, i) => (
                          <Card key={i} className="border-destructive/20">
                            <CardContent className="p-4 space-y-2">
                              <p className="text-xs font-bold text-destructive italic">"{f.problematicText}"</p>
                              <div className="bg-muted p-2 rounded text-[10px] font-serif border">{f.citationSuggestion}</div>
                              <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={() => handleSaveToBiblio(f.citationSuggestion, "Scholar Integrity Match")}>Add to Biblio</Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : <Card className="h-full flex items-center justify-center p-8 text-center border-dashed"><p className="text-muted-foreground text-sm">Scan your draft for missing citations and uncredited scholarly phrasing.</p></Card>}
                  </ScrollArea>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>

        <Dialog open={!!activeCitation} onOpenChange={() => setActiveCitation(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline">{activeCitation?.type === 'footnote' ? 'Footnote' : 'Inline Citation'} Generated</DialogTitle>
              <DialogDescription>Formatted in {biblioStyle} standard.</DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-4 rounded border font-serif text-lg leading-relaxed select-all">
              {activeCitation?.text}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(activeCitation?.text || ''); toast({ title: "Copied" }); }}>Copy to Clipboard</Button>
              <Button onClick={() => { handleSaveNote(activeCitation?.text || '', `Citation (${activeCitation?.type})`); setActiveCitation(null); }}>Save to Notes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

async function exportToGoogleDocs(title: string, content: string) {
  // Simulating export functionality - in a real app this would call Google Docs API via server action
  navigator.clipboard.writeText(content);
  window.open('https://docs.google.com/', '_blank');
}