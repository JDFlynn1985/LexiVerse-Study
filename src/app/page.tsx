'use client';

import { useState, useEffect, useId, useRef, useMemo } from 'react';
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
  Volume2,
  ArrowRight,
  Clock,
  File,
  StickyNote,
  Image as ImageIcon,
  Eye,
  Cloud,
  FolderOpen
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
import { getVersions, getChapterContent, parseReference, type BibleVersion, type BibleChapter } from '@/lib/bible-api';

type ViewMode = 'dashboard' | 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers' | 'writing-assistant' | 'integrity';

interface Note {
  id: string;
  content: string;
  source: string;
  date: string;
  driveFileId?: string;
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
  format: 'txt' | 'pdf' | 'docx' | 'gdoc' | 'gsheet' | 'png' | 'jpg' | 'jpeg' | 'webp';
  author?: string;
  date: string;
  driveFileId?: string;
}

interface SessionItem {
  id: string;
  title: string;
  type: 'note' | 'paper';
  timestamp: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
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
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [biblioItems, setBiblioItems] = useState<BiblioItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [sessionRecentItems, setSessionRecentItems] = useState<SessionItem[]>([]);
  
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
      const token = credential?.accessToken || null;
      setGoogleAccessToken(token);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userData = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      setDoc(userRef, userData, { merge: true });
      toast({ title: "Logged in", description: `Welcome back, ${result.user.displayName}` });

      if (token) {
        initializeDriveFolder(token);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  const initializeDriveFolder = async (token: string) => {
    try {
      // Search for LexiVerse folder
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='LexiVerse Research' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        setDriveFolderId(searchData.files[0].id);
      } else {
        // Create new folder
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'LexiVerse Research',
            mimeType: 'application/vnd.google-apps.folder'
          })
        });
        const createData = await createRes.json();
        setDriveFolderId(createData.id);
      }
    } catch (error) {
      console.error("Failed to initialize Google Drive folder", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGoogleAccessToken(null);
    setDriveFolderId(null);
    toast({ title: "Logged out" });
  };

  const updateSessionItems = (id: string, title: string, type: 'note' | 'paper') => {
    setSessionRecentItems(prev => {
      const newItem: SessionItem = { id, title, type, timestamp: Date.now() };
      return [newItem, ...prev].slice(0, 5);
    });
  };

  const handleSaveNote = (content: string, source: string = "Selection") => {
    if (!content.trim()) return;
    const noteId = Date.now().toString();
    const newNote = { id: noteId, content: content.trim(), source, date: new Date().toLocaleString() };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('lexiverse_notes', JSON.stringify(updated));
    updateSessionItems(noteId, content.substring(0, 30) + '...', 'note');
    toast({ title: "Note Saved" });
  };

  const syncToDrive = async (type: 'note' | 'paper', id: string) => {
    if (!googleAccessToken || !driveFolderId) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Please link your Google account first." });
      return;
    }

    setIsLoading(true);
    try {
      let name = "";
      let content = "";
      let mimeType = "application/vnd.google-apps.document"; // Default to Google Doc

      if (type === 'note') {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        name = `Note: ${note.source} (${note.date})`;
        content = note.content;
      } else {
        const paper = researchPapers.find(p => p.id === id);
        if (!paper) return;
        name = paper.title;
        content = paper.content;
        if (['png', 'jpg', 'jpeg', 'webp'].includes(paper.format)) {
          mimeType = `image/${paper.format === 'jpg' ? 'jpeg' : paper.format}`;
          // For images, we just upload the base64 as binary
          const blob = await (await fetch(paper.content)).blob();
          const metadata = { name, parents: [driveFolderId] };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', blob);

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${googleAccessToken}` },
            body: form
          });
          const data = await res.json();
          if (data.id) toast({ title: "Synced to Drive", description: "Image uploaded to LexiVerse Research folder." });
          setIsLoading(false);
          return;
        }
      }

      // Upload text as Google Doc
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.document',
          parents: [driveFolderId]
        })
      });
      const data = await res.json();
      
      if (data.id) {
        // Update the document content
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${data.id}?uploadType=media`, {
          method: 'PATCH',
          headers: { 
            Authorization: `Bearer ${googleAccessToken}`,
            'Content-Type': 'text/plain'
          },
          body: content
        });
        toast({ title: "Synced to Drive", description: `${name} is now in your Google Drive.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToBiblio = (citation: string, type: string = "Research Source") => {
    if (!citation.trim()) return;
    const newItem = { id: Date.now().toString(), citation: citation.trim(), sourceType: type, date: new Date().toLocaleString() };
    const updated = [newItem, ...biblioItems];
    setBiblioItems(updated);
    localStorage.setItem('lexiverse_biblio', JSON.stringify(updated));
    toast({ title: "Citation Added" });
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
        researchContext: researchPapers.map(p => p.content).slice(0, 3)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let format: ResearchPaper['format'] = 'txt';
      let content = "";

      if (ext === 'pdf') {
        format = 'pdf';
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ');
        }
        content = text;
      } else if (ext === 'docx') {
        format = 'docx';
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
        format = ext as any;
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        format = 'txt';
        content = await file.text();
      }

      const paperId = Date.now().toString();
      const newPaper: ResearchPaper = { id: paperId, title: file.name, content, format, date: new Date().toLocaleDateString() };
      const updated = [newPaper, ...researchPapers];
      setResearchPapers(updated);
      localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
      updateSessionItems(paperId, file.name, 'paper');
      toast({ title: "Document Added", description: `${file.name} is now available in library.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const captureSelectionToNotes = () => {
    const selection = window.getSelection()?.toString();
    if (selection) handleSaveNote(selection, "Manual Study Capture");
    else toast({ variant: "destructive", title: "No Text Selected" });
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
              <SidebarGroupLabel>Session Activity</SidebarGroupLabel>
              <SidebarMenu>
                {sessionRecentItems.length > 0 ? (
                  sessionRecentItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveTab(item.type === 'paper' ? 'papers' : 'notes')}
                        tooltip={item.title}
                        className="group"
                      >
                        {item.type === 'paper' ? <File className="h-4 w-4" /> : <StickyNote className="h-4 w-4" />}
                        <span className="truncate">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <div className="px-2 py-1 text-xs text-muted-foreground italic group-data-[collapsible=icon]:hidden">
                      No session items yet
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>

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
              <div className="space-y-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start px-2 py-6">
                      <img src={user.photoURL || ''} className="h-8 w-8 rounded-full border mr-3" alt="" />
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="text-sm font-semibold truncate group-data-[collapsible=icon]:hidden">{user.displayName}</span>
                        {driveFolderId && <span className="text-[10px] text-emerald-600 flex items-center gap-1"><Cloud className="h-2 w-2" /> Sync Enabled</span>}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
          <main className="container max-w-6xl mx-auto py-8 px-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col gap-2">
                  <h1 className="text-4xl font-bold font-headline">Welcome back, {user?.displayName?.split(' ')[0] || 'Scholar'}</h1>
                  <p className="text-muted-foreground text-lg">Your scholarly research workspace is ready.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Work</CardDescription>
                      <CardTitle className="text-3xl">{history.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Activities tracked this session</CardContent>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><FileText className="h-4 w-4" /> My Library</CardDescription>
                      <CardTitle className="text-3xl">{researchPapers.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Scholarly papers indexed</CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><Scroll className="h-4 w-4" /> Research Notes</CardDescription>
                      <CardTitle className="text-3xl">{notes.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Captured study fragments</CardContent>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Citations</CardDescription>
                      <CardTitle className="text-3xl">{biblioItems.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Pending bibliography items</CardContent>
                  </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                  <Card className="lg:col-span-2 shadow-sm border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-headline">Quick Access Documents</CardTitle>
                        <CardDescription>Recently uploaded or accessed research papers.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('papers')}>View Library <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                      {researchPapers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {researchPapers.slice(0, 4).map(paper => (
                            <div key={paper.id} className="flex items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => { setActiveTab('papers'); }}>
                              <div className={`p-2 rounded bg-muted group-hover:bg-background transition-colors mr-3`}>
                                {['png', 'jpg', 'jpeg', 'webp'].includes(paper.format) ? <ImageIcon className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold truncate">{paper.title}</p>
                                <p className="text-[10px] text-muted-foreground">{paper.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground opacity-40">
                          <Library className="h-12 w-12 mb-4" />
                          <p>Your library is currently empty.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-headline">Recent Research Logs</CardTitle>
                      <CardDescription>Lexicon and Scripture history.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                        {history.length > 0 ? (
                          <div className="divide-y">
                            {history.map(item => (
                              <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center group" onClick={() => {
                                if (item.type === 'Lexicon') { setStrongsTerm(item.term); handleLexiconSearch(); setActiveTab('lexicon'); }
                                else { setPassageRef(item.term); loadPassage(); setActiveTab('bibles'); }
                              }}>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] py-0">{item.type}</Badge>
                                    <span className="text-sm font-bold font-headline">{item.term}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{item.date}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-20 text-center text-muted-foreground opacity-30">
                            <History className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs">No research history yet.</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setActiveTab('scholar-ai')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                        <MessageSquare className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-lg">Continue Dialogue</CardTitle>
                        <CardDescription className="text-xs">Scholar AI is ready to synthesize.</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setActiveTab('writing-assistant')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Edit3 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-lg">Writing Assistant</CardTitle>
                        <CardDescription className="text-xs">Refine your latest draft.</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setActiveTab('integrity')}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20 transition-colors">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-lg">Integrity Scan</CardTitle>
                        <CardDescription className="text-xs">Check citations and attribution.</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            )}

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
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card>
                        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Quote className="h-4 w-4" /> Scriptural Usage</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {lexiconResult.scriptureReferences.map((ref, i) => (
                            <Button key={i} variant="ghost" size="sm" className="w-full justify-start font-mono text-xs" onClick={() => {setPassageRef(ref); loadPassage(); setActiveTab('bibles');}}>
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
                  <p className="text-muted-foreground">Compare translation philosophies side-by-side.</p>
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
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scholar-ai' && (
              <div className="h-[calc(100vh-160px)] flex flex-col animate-in fade-in">
                <header className="border-b pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scholar AI Chat</h1>
                    <p className="text-muted-foreground text-sm">Synthetic analysis across scripture and your library.</p>
                  </div>
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
                      className="h-12 shadow-inner bg-card"
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

            {activeTab === 'papers' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Research Library</h1>
                    <p className="text-muted-foreground">Your custom knowledge base for the Scholar AI.</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Plus className="h-4 w-4 mr-2" /> Add Paper or Image</Button>
                  </div>
                </header>
                <div className="grid gap-4 md:grid-cols-3">
                  {researchPapers.map(paper => (
                    <Card key={paper.id} className="group overflow-hidden">
                      <div className={`h-1 w-full ${
                        paper.format === 'pdf' ? 'bg-red-500' : 
                        paper.format === 'docx' ? 'bg-blue-500' : 
                        ['png', 'jpg', 'jpeg', 'webp'].includes(paper.format) ? 'bg-emerald-500' : 
                        'bg-gray-500'
                      }`} />
                      {['png', 'jpg', 'jpeg', 'webp'].includes(paper.format) && (
                        <div className="aspect-video w-full bg-muted overflow-hidden">
                          <img src={paper.content} alt={paper.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-bold line-clamp-1">{paper.title}</CardTitle>
                          <Badge variant="secondary" className="text-[8px] uppercase">{paper.format}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-[10px] text-muted-foreground line-clamp-3 italic">Uploaded on {paper.date}</p></CardContent>
                      <CardFooter className="justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {driveFolderId && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => syncToDrive('paper', paper.id)}>
                            <CloudDownload className="h-3 w-3" />
                          </Button>
                        )}
                        {['png', 'jpg', 'jpeg', 'webp'].includes(paper.format) && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{paper.title}</DialogTitle>
                                <DialogDescription>Academic Reference Image</DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 flex justify-center">
                                <img src={paper.content} alt={paper.title} className="max-h-[70vh] rounded-lg shadow-xl" />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                          const updated = researchPapers.filter(p => p.id !== paper.id);
                          setResearchPapers(updated);
                          localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Research Notes</h1>
                    <p className="text-muted-foreground">Captured fragments and study reflections.</p>
                  </div>
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
                        {driveFolderId && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => syncToDrive('note', note.id)}>
                            <CloudDownload className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                          const updated = notes.filter(n => n.id !== note.id);
                          setNotes(updated);
                          localStorage.setItem('lexiverse_notes', JSON.stringify(updated));
                        }}><Trash2 className="h-4 w-4" /></Button>
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
                    <div className="relative">
                      <Textarea 
                        placeholder="Paste your draft here..." 
                        className="min-h-[450px] leading-relaxed" 
                        value={writingInput} 
                        onChange={(e) => setWritingInput(e.target.value)} 
                      />
                      {googleAccessToken && (
                        <div className="absolute top-2 right-2">
                          <Button variant="ghost" size="sm" onClick={() => handleSaveNote(writingInput, "AI Draft Refinement")}>
                            <Scroll className="h-4 w-4 mr-2" /> Save to Notes
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button className="w-full h-12" onClick={handleWritingRefinement} disabled={isLoading}><Sparkles className="h-5 w-5 mr-2" /> Refine Draft</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Scholar AI Refinement</Label>
                      {writingResult && driveFolderId && (
                        <Button variant="outline" size="sm" onClick={() => {
                          const name = `Refined Draft (${new Date().toLocaleDateString()})`;
                          // Manually calling sync logic for refined draft
                          const tempId = Date.now().toString();
                          const tempNote = { id: tempId, content: writingResult.improvedText, source: 'AI Refinement', date: new Date().toLocaleString() };
                          setNotes(prev => [tempNote, ...prev]);
                          syncToDrive('note', tempId);
                        }}>
                          <CloudDownload className="h-4 w-4 mr-2" /> Export to Google Docs
                        </Button>
                      )}
                    </div>
                    <Card className="min-h-[450px] bg-muted/5 p-6">
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
            
            {activeTab === 'bibliography' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div><h1 className="text-3xl font-bold font-headline">Academic Citation Manager</h1><p className="text-muted-foreground">Generate bibliographies and references.</p></div>
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
                {formattedBiblioResult ? (
                  <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5 border-b flex justify-between items-center flex-row">
                      <CardTitle className="text-lg">Formatted Bibliography</CardTitle>
                      <div className="flex gap-2">
                        {driveFolderId && (
                          <Button variant="outline" size="sm" onClick={async () => {
                            const res = await fetch('https://www.googleapis.com/drive/v3/files', {
                              method: 'POST',
                              headers: { 
                                Authorization: `Bearer ${googleAccessToken}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                name: `Bibliography - ${biblioStyle} (${new Date().toLocaleDateString()})`,
                                mimeType: 'application/vnd.google-apps.document',
                                parents: [driveFolderId]
                              })
                            });
                            const data = await res.json();
                            if (data.id) {
                              await fetch(`https://www.googleapis.com/upload/drive/v3/files/${data.id}?uploadType=media`, {
                                method: 'PATCH',
                                headers: { Authorization: `Bearer ${googleAccessToken}`, 'Content-Type': 'text/plain' },
                                body: formattedBiblioResult.formattedOutput
                              });
                              toast({ title: "Exported to Docs" });
                            }
                          }}><CloudDownload className="h-4 w-4 mr-2" /> Google Docs</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(formattedBiblioResult.formattedOutput); toast({ title: "Copied" }); }}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8"><p className="whitespace-pre-wrap font-serif text-lg leading-loose">{formattedBiblioResult.formattedOutput}</p></CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {biblioItems.map(item => (
                      <Card key={item.id} className="p-4 flex justify-between items-center">
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-[10px]">{item.sourceType}</Badge>
                          <p className="text-sm font-medium">{item.citation}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setBiblioItems(biblioItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'integrity' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center"><h1 className="text-3xl font-bold font-headline">Integrity & Citation Scanner</h1><p className="text-muted-foreground">Ensure scholarly attribution.</p></header>
                <div className="grid gap-6 md:grid-cols-1 max-w-3xl mx-auto">
                  <div className="space-y-4">
                    <Textarea placeholder="Paste text to scan for attribution errors..." className="min-h-[350px]" value={integrityInput} onChange={(e) => setIntegrityInput(e.target.value)} />
                    <Button className="w-full h-12" onClick={handleIntegrityScan} disabled={isLoading}><ShieldCheck className="h-5 w-5 mr-2" /> Run Integrity Scan</Button>
                  </div>
                  {integrityResult && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Scan Summary - Score: {integrityResult.integrityScore}%</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm">{integrityResult.analysisSummary}</p>
                        {integrityResult.findings.map((f, i) => (
                          <div key={i} className="p-3 bg-muted rounded border text-xs space-y-1">
                            <p className="font-bold text-destructive">Potential Plagiarism: "{f.problematicText}"</p>
                            <p className="italic">Suggestion: {f.citationSuggestion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

          </main>
        </SidebarInset>

        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2">
          {googleAccessToken && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="shadow-lg h-10 border bg-white">
                  <Share2 className="h-4 w-4 mr-2" /> Share / Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>External Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const selection = window.getSelection()?.toString();
                  if (selection) {
                    const url = `https://keep.google.com/u/0/#create/${encodeURIComponent(selection)}`;
                    window.open(url, '_blank');
                  } else {
                    toast({ variant: "destructive", title: "Nothing Selected", description: "Select text first to copy to Keep." });
                  }
                }}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Copy Selection to Keep
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://drive.google.com/drive/u/0/folders/${driveFolderId}`, '_blank')}>
                  <FolderOpen className="h-4 w-4 mr-2" /> Open Research Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="secondary" className="shadow-lg h-10 border" onClick={captureSelectionToNotes}>
            <Highlighter className="h-4 w-4 mr-2" /> Capture Highlight
          </Button>
        </div>
      </div>
    </SidebarProvider>
  );
}

