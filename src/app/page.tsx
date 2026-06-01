
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
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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
  BookMarked
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

type ViewMode = 'dashboard' | 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers' | 'gallery' | 'writing-assistant' | 'integrity' | 'ai-settings' | 'theology-map' | 'timeline' | 'maps';

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
  extractedText?: string;
}

interface SessionItem {
  id: string;
  title: string;
  type: 'note' | 'paper';
  timestamp: number;
}

interface AiPreferences {
  selectedModel: 'googleai/gemini-2.5-pro-001' | 'googleai/gemini-2.5-flash';
  customApiKey: string;
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
  
  const [aiPrefs, setAiPrefs] = useState<AiPreferences>({
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

  const [transWord, setTransWord] = useState('');
  const [transResult, setTransResult] = useState<CompareTranslationsOutput | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['kjv', 'net']);

  const [currentPassage, setCurrentPassage] = useState<BibleChapter | null>(null);
  const [passageRef, setPassageRef] = useState('John 1');
  const [readingVersion, setReadingVersion] = useState('kjv');

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);

  const [writingInput, setWritingInput] = useState('');
  const [writingResult, setWritingResult] = useState<WritingAssistantOutput | null>(null);

  const [biblioStyle, setBiblioStyle] = useState<'SBL' | 'Turabian' | 'Chicago' | 'APA' | 'MLA'>('SBL');
  const [formattedBiblioResult, setFormattedBiblioResult] = useState<FormatBibliographyOutput | null>(null);

  const [integrityInput, setIntegrityInput] = useState('');
  const [integrityResult, setIntegrityResult] = useState<AcademicIntegrityOutput | null>(null);

  const [theoConcept, setTheoConcept] = useState('');
  const [theoResult, setTheoResult] = useState<TheologicalConceptOutput | null>(null);
  const [timelineTopic, setTimelineTopic] = useState('');
  const [timelineResult, setTimelineResult] = useState<HistoricalTimelineOutput | null>(null);

  const galleryImages = useMemo(() => {
    return researchPapers.filter(p => isImage(p.format));
  }, [researchPapers]);

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
    if (user && db) {
      const userRef = doc(db, 'users', user.uid);
      const unsub = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.aiPreferences) {
            setAiPrefs(data.aiPreferences);
          }
        }
      });
      return () => unsub();
    }
  }, [user, db]);

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

  const handleSaveAiPrefs = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { aiPreferences: aiPrefs }, { merge: true });
      toast({ title: "Settings Saved", description: "Your AI preferences have been updated." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Update Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDriveFolder = async (token: string) => {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='LexiVerse Research' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        setDriveFolderId(searchData.files[0].id);
      } else {
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
      let mimeType = "application/vnd.google-apps.document"; 

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
        if (isImage(paper.format)) {
          mimeType = `image/${paper.format === 'jpg' ? 'jpeg' : paper.format}`;
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

  const handleLexiconSearch = async () => {
    if (!strongsTerm.trim()) return;
    setIsLoading(true);
    try {
      const result = await defineAndAnalyzeTerm({ strongsNumber: strongsTerm, model: aiPrefs.selectedModel });
      setLexiconResult(result);
      const newHistory = [{id: Date.now().toString(), type: 'Lexicon', term: strongsTerm, date: new Date().toLocaleString()}, ...history];
      setHistory(newHistory.slice(0, 10));
      localStorage.setItem('lexiverse_history', JSON.stringify(newHistory));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Lexicon search failed', description: 'Scholarly engine took too long or was unavailable. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDictionarySearch = async () => {
    if (!dictTerm.trim()) return;
    setIsLoading(true);
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
    try {
      const result = await analyzeTheologicalConcept({ concept: theoConcept });
      setTheoResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Theology mapping failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimelineGenerate = async () => {
    if (!timelineTopic.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateHistoricalTimeline({ topic: timelineTopic });
      setTimelineResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Timeline generation failed' });
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
      const context = researchPapers.map(p => {
        let text = p.content;
        if (p.extractedText) text += `\n[EXTRACTED FROM IMAGE]: ${p.extractedText}`;
        return text;
      }).slice(0, 3);

      const result = await interactiveVerseExplorationAI({
        term: strongsTerm || 'Bible Study',
        question: chatInput,
        history: chatHistory,
        researchContext: context,
        model: aiPrefs.selectedModel
      });
      setChatHistory(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Scholar AI Error' });
    } finally {
      setIsLoading(false);
    }
  };

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
      } else if (isImage(ext || '')) {
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

  const handlePerformOCR = async (paperId: string) => {
    const paper = researchPapers.find(p => p.id === paperId);
    if (!paper || !isImage(paper.format)) return;

    setIsLoading(true);
    try {
      const result = await extractTextFromImage({ imagePart: paper.content });
      const updated = researchPapers.map(p => 
        p.id === paperId ? { ...p, extractedText: result.text } : p
      );
      setResearchPapers(updated);
      localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
      toast({ title: "OCR Complete", description: "Text has been extracted and indexed for Scholar AI." });
    } catch (error) {
      toast({ variant: 'destructive', title: 'OCR Failed', description: "Could not extract text from this image." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWritingRefinement = async () => {
    if (!writingInput.trim()) return;
    setIsLoading(true);
    try {
      const result = await refineWriting({ text: writingInput, mode: 'academic' });
      setWritingResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Refinement Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrityScan = async () => {
    if (!integrityInput.trim()) return;
    setIsLoading(true);
    try {
      const result = await checkIntegrity({ 
        text: integrityInput, 
        researchContext: researchPapers.map(p => p.content).slice(0, 3) 
      });
      setIntegrityResult(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Integrity Scan Failed' });
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
      toast({ variant: 'destructive', title: 'Comparison Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const captureSelectionToNotes = () => {
    const selection = window.getSelection()?.toString();
    if (selection) handleSaveNote(selection, "Manual Study Capture");
    else toast({ variant: "destructive", title: "No Text Selected" });
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
                  { id: 'dictionaries', label: 'Dictionaries', icon: BookMarked },
                  { id: 'commentaries', label: 'Commentaries', icon: Scroll },
                  { id: 'translations', label: 'Parallel Versions', icon: Scale },
                  { id: 'papers', label: 'My Papers', icon: Library },
                  { id: 'gallery', label: 'Gallery & Maps', icon: ImagesIcon },
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
              <SidebarGroupLabel>Academic Synthesis</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'theology-map', label: 'Theology Index', icon: Network },
                  { id: 'timeline', label: 'Timeline & History', icon: Milestone },
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

            <SidebarGroup>
              <SidebarGroupLabel>Configuration</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'ai-settings'} onClick={() => setActiveTab('ai-settings')} tooltip="AI Engine Settings">
                    <Cpu className="h-5 w-5" /> <span>AI Engine</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4 border-t pt-4">
              <SidebarGroupLabel>Support LexiVerse</SidebarGroupLabel>
              <div className="px-2 py-1">
                <div className="bg-muted/30 border-2 border-dashed rounded-lg p-3 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Scholar Support</span>
                  <div 
                    className="w-full aspect-[3/1] bg-muted/20 rounded flex items-center justify-center border border-muted-foreground/10 hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => handleAdClick('scholar_support_widget', 'sidebar')}
                  >
                    <div className="flex flex-col items-center">
                      <Megaphone className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
                      <p className="text-[8px] text-muted-foreground italic font-medium">Highlight your resource</p>
                    </div>
                  </div>
                </div>
              </div>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel>Legal</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/privacy" passHref>
                    <SidebarMenuButton tooltip="Privacy Policy">
                      <Shield className="h-5 w-5" /> <span>Privacy Policy</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/terms" passHref>
                    <SidebarMenuButton tooltip="Terms of Use">
                      <FileText className="h-5 w-5" /> <span>Terms of Use</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
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
                    <DropdownMenuItem onClick={() => setActiveTab('ai-settings')}><Settings className="h-4 w-4 mr-2" /> AI Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
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
                      <CardDescription className="flex items-center gap-2"><Clock className="h-4 w-4" /> Recent Activity</CardDescription>
                      <CardTitle className="text-3xl">{history.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Session steps tracked</CardContent>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20 cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setActiveTab('gallery')}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><ImagesIcon className="h-4 w-4" /> Visual Gallery</CardDescription>
                      <CardTitle className="text-3xl">{galleryImages.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Images & Charts cataloged</CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><Scroll className="h-4 w-4" /> Research Notes</CardDescription>
                      <CardTitle className="text-3xl">{notes.length}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">Captured study fragments</CardContent>
                  </Card>
                  <Card className="bg-accent/5 border-accent/20 cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => setActiveTab('ai-settings')}>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2"><Cpu className="h-4 w-4" /> AI Engine</CardDescription>
                      <CardTitle className="text-xs truncate">{aiPrefs.selectedModel.split('/').pop()}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-[10px] text-muted-foreground">Active processing model</CardContent>
                  </Card>
                </div>

                <Card 
                  className="bg-muted/10 border-dashed border-2 flex flex-col items-center justify-center p-6 transition-all hover:bg-muted/20 cursor-pointer group"
                  onClick={() => handleAdClick('theological_resource_spotlight', 'dashboard_spotlight')}
                >
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-left space-y-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Theological Resource Spotlight</span>
                      <p className="text-sm italic text-muted-foreground font-headline">Support LexiVerse by sponsoring academic journals, archaeological databases, or commentary series.</p>
                    </div>
                  </div>
                </Card>

                <div className="grid gap-8 lg:grid-cols-3">
                  <Card className="lg:col-span-2 shadow-sm border-dashed">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-headline">Quick Access Library</CardTitle>
                        <CardDescription>Recently accessed or uploaded research papers.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('papers')}>View Library <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent>
                      {researchPapers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {researchPapers.slice(0, 4).map(paper => (
                            <div key={paper.id} className="flex items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => { setActiveTab(isImage(paper.format) ? 'gallery' : 'papers'); }}>
                              <div className={`p-2 rounded bg-muted group-hover:bg-background transition-colors mr-3`}>
                                {isImage(paper.format) ? <ImageIcon className="h-4 w-4" /> : <FileCode className="h-4 w-4" />}
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
                      <CardTitle className="text-xl font-headline">Session Research Log</CardTitle>
                      <CardDescription>Recent lexicon and scripture queries.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                        {history.length > 0 ? (
                          <div className="divide-y">
                            {history.map(item => (
                              <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex justify-between items-center group" onClick={() => {
                                if (item.type === 'Lexicon') { setStrongsTerm(item.term); handleLexiconSearch(); setActiveTab('lexicon'); }
                                else if (item.type === 'Dictionary') { setDictTerm(item.term); handleDictionarySearch(); setActiveTab('dictionaries'); }
                                else if (item.type === 'Commentary') { setCommWord(item.term); handleCommentarySearch(); setActiveTab('commentaries'); }
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
              </div>
            )}

            {activeTab === 'ai-settings' && (
              <div className="space-y-8 animate-in fade-in max-w-4xl mx-auto">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">AI Engine Configuration</h1>
                  <p className="text-muted-foreground">Select your processing model and manage personal API credentials.</p>
                </header>

                <div className="grid gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /> Model Selection</CardTitle>
                      <CardDescription>Choose the core model for your theological analysis. Free-tier models are prioritized for accessibility.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div 
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${aiPrefs.selectedModel === 'googleai/gemini-2.5-flash' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                          onClick={() => setAiPrefs({ ...aiPrefs, selectedModel: 'googleai/gemini-2.5-flash' })}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="font-bold">Gemini 2.5 Flash</span>
                              <Badge variant="secondary" className="w-fit text-[10px] px-1 py-0 mt-1">Default / Free Tier</Badge>
                            </div>
                            {aiPrefs.selectedModel === 'googleai/gemini-2.5-flash' && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">The standard Genkit-optimized engine. High-speed, efficient, and offers the most generous free usage limits. Best for rapid definitions and OCR transcription.</p>
                        </div>

                        <div 
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${aiPrefs.selectedModel === 'googleai/gemini-2.5-pro-001' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                          onClick={() => setAiPrefs({ ...aiPrefs, selectedModel: 'googleai/gemini-2.5-pro-001' })}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                              <span className="font-bold">Gemini 2.5 Pro</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0 mt-1">Advanced / Paid Tier</Badge>
                            </div>
                            {aiPrefs.selectedModel === 'googleai/gemini-2.5-pro-001' && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">Advanced reasoning engine for complex synthesis. Best for deep eschatological analysis. May require a personal API key with billing for high-volume research.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> API Credentials</CardTitle>
                      <CardDescription>Provide your own API keys to increase rate limits or use custom billing accounts.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Google AI (Gemini) API Key</Label>
                        <Input 
                          type="password" 
                          placeholder="AIza..." 
                          value={aiPrefs.customApiKey} 
                          onChange={(e) => setAiPrefs({ ...aiPrefs, customApiKey: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground italic">Keys are encrypted and stored in your secure user profile.</p>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/5 border-t p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                        <Info className="h-3 w-3" />
                        Custom keys override default app limits.
                      </div>
                      <Button onClick={handleSaveAiPrefs} disabled={isLoading || !user}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                        Apply Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'dictionaries' && (
              <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">Biblical Dictionaries</h1>
                  <p className="text-muted-foreground">General definitions and theological context for biblical terms.</p>
                </header>
                
                <div className="flex gap-4 max-w-md mx-auto">
                  <Input 
                    placeholder="Enter term (e.g. Grace, Justification)" 
                    value={dictTerm} 
                    onChange={(e) => setDictTerm(e.target.value)} 
                  />
                  <Button onClick={handleDictionarySearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
                  </Button>
                </div>

                {dictResult && (
                  <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5">
                      <CardTitle className="text-4xl font-bold font-headline text-primary">{dictResult.originalWord}</CardTitle>
                      <CardDescription className="text-lg mt-1 italic">{dictResult.transliteration} • [{dictResult.pronunciation}]</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Dictionary Definition</h4>
                        {dictResult.definitions.map((def, i) => (
                          <p key={i} className="text-lg leading-relaxed font-serif mb-4">{def}</p>
                        ))}
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Theological Summary</h4>
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{dictResult.summary}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'commentaries' && (
              <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">Scholarly Commentaries</h1>
                  <p className="text-muted-foreground">Historical and linguistic context from academic commentators.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Word or Phrase</Label>
                    <Input value={commWord} onChange={e => setCommWord(e.target.value)} placeholder="e.g. Logos, Paraclete" />
                  </div>
                  <div className="w-[150px] space-y-2">
                    <Label>Language</Label>
                    <Select value={commLanguage} onValueChange={setCommLanguage}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Greek">Greek</SelectItem>
                        <SelectItem value="Hebrew">Hebrew</SelectItem>
                        <SelectItem value="Aramaic">Aramaic</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCommentarySearch} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />} Search Commentaries
                  </Button>
                </div>

                {commResult && (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-2xl font-headline">Commentary Summary: {commResult.searchWord}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{commResult.commentarySummary}</p>
                      </CardContent>
                      <CardFooter className="bg-muted/5 border-t">
                        <div className="text-[10px] font-mono text-muted-foreground italic">Source citations: {commResult.bibliography}</div>
                      </CardFooter>
                    </Card>

                    <div className="space-y-4">
                       <h3 className="text-sm font-bold uppercase tracking-widest px-2">Key Scholarly Insights</h3>
                       {commResult.specificInsights.map((insight, i) => (
                         <Card key={i} className="bg-accent/5 border-accent/20">
                           <CardHeader className="p-4 pb-2">
                             <div className="flex justify-between items-center">
                               <CardTitle className="text-xs font-bold text-primary">{insight.commentator}</CardTitle>
                               {insight.relevantVerse && <Badge variant="outline" className="text-[9px]">{insight.relevantVerse}</Badge>}
                             </div>
                           </CardHeader>
                           <CardContent className="p-4 pt-0">
                             <p className="text-[11px] leading-relaxed italic">"{insight.insight}"</p>
                           </CardContent>
                         </Card>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'theology-map' && (
              <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
                <header className="text-center space-y-2">
                  <h1 className="text-3xl font-bold font-headline">Theological Concept Mapper</h1>
                  <p className="text-muted-foreground">Systemic analysis of complex doctrinal concepts.</p>
                </header>

                <div className="flex gap-4 max-w-lg mx-auto">
                  <Input 
                    placeholder="Enter concept (e.g., Justification, Covenant)" 
                    value={theoConcept} 
                    onChange={e => setTheoConcept(e.target.value)}
                  />
                  <Button onClick={handleTheologyMap} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4 mr-2" />} Map Concept
                  </Button>
                </div>

                {theoResult && (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="font-headline text-3xl text-primary">{theoResult.concept}</CardTitle>
                        <CardDescription className="italic">{theoResult.etymology}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Scholarly Definition</h3>
                          <p className="text-lg font-serif leading-relaxed">{theoResult.definition}</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Historical Development</h3>
                          <div className="space-y-4">
                            {theoResult.historicalDevelopment.map((d, i) => (
                              <div key={i} className="flex gap-4">
                                <Badge variant="secondary" className="h-fit py-1">{d.period}</Badge>
                                <div>
                                  <p className="text-sm font-semibold">{d.keyDevelopment}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Key Figures: {d.notableFigures.join(', ')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Synthesis & Bibliography</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{theoResult.academicSynthesis}</p>
                          <div className="mt-6 p-4 bg-muted/30 rounded border text-[10px] font-mono whitespace-pre-wrap">
                            {theoResult.bibliography}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2"><Quote className="h-4 w-4" /> Scriptural Foundations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {theoResult.keyVerses.map((v, i) => (
                          <div key={i} className="space-y-1">
                            <Button variant="link" className="p-0 h-auto font-bold text-primary" onClick={() => {setPassageRef(v.reference); loadPassage(); setActiveTab('bibles');}}>
                              {v.reference}
                            </Button>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">{v.significance}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
                <header className="text-center space-y-2">
                  <h1 className="text-3xl font-bold font-headline">Historical Timeline & Context</h1>
                  <p className="text-muted-foreground">Chronological mapping of biblical and extra-biblical events.</p>
                </header>

                <div className="flex gap-4 max-w-lg mx-auto">
                  <Input 
                    placeholder="Enter period or event (e.g., Exile, Paul's Journeys)" 
                    value={timelineTopic} 
                    onChange={e => setTimelineTopic(e.target.value)}
                  />
                  <Button onClick={handleTimelineGenerate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Milestone className="h-4 w-4 mr-2" />} Generate
                  </Button>
                </div>

                {timelineResult && (
                  <div className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl font-headline">Historical Summary: {timelineResult.topic}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">{timelineResult.summary}</p>
                      </CardContent>
                    </Card>

                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {timelineResult.timeline.map((item, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <Badge variant={item.sourceType === 'Archaeological' ? 'outline' : 'default'} className="p-0 h-4 w-4 rounded-full" />
                          </div>
                          <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 shadow-sm group-hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-1">
                              <time className="font-bold text-primary font-headline text-lg">{item.date}</time>
                              <Badge variant="secondary" className="text-[10px]">{item.sourceType}</Badge>
                            </div>
                            <h4 className="font-bold mb-2">{item.event}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                          </Card>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <Card>
                        <CardHeader className="bg-primary/5">
                          <CardTitle className="text-sm uppercase tracking-widest font-bold">Archaeological Context</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground leading-relaxed">{timelineResult.archaeologicalContext}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="bg-accent/5">
                          <CardTitle className="text-sm uppercase tracking-widest font-bold">Scholarly Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground leading-relaxed">{timelineResult.scholarlyAnalysis}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Gallery & Maps</h1>
                    <p className="text-muted-foreground">Visual resources including archaeological maps, manuscript photos, and charts.</p>
                  </div>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Visual
                  </Button>
                </header>
                {galleryImages.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryImages.map(img => (
                      <Card key={img.id} className="group overflow-hidden bg-muted/20 flex flex-col">
                        <div className="aspect-[4/3] w-full overflow-hidden relative">
                          <img src={img.content} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="icon" variant="secondary" className="rounded-full"><Maximize2 className="h-4 w-4" /></Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
                                  <img src={img.content} alt={img.title} className="w-full h-auto max-h-[85vh] object-contain shadow-2xl rounded-lg" />
                                  <div className="p-4 bg-background/80 backdrop-blur-md text-center">
                                    <h3 className="font-headline font-bold text-lg">{img.title}</h3>
                                    <p className="text-xs text-muted-foreground italic">Reference Item • {img.date}</p>
                                    {img.extractedText && (
                                      <ScrollArea className="h-32 mt-4 text-left p-2 bg-muted/50 rounded text-xs leading-relaxed">
                                        <div className="font-mono">{img.extractedText}</div>
                                      </ScrollArea>
                                    )}
                                  </div>
                                </DialogContent>
                             </Dialog>
                             {driveFolderId && (
                               <Button size="icon" variant="secondary" className="rounded-full" onClick={() => syncToDrive('paper', img.id)}><CloudDownload className="h-4 w-4" /></Button>
                             )}
                          </div>
                        </div>
                        <CardContent className="p-4 flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold truncate flex-1">{img.title}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{img.format.toUpperCase()}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Captured: {img.date}</p>
                          {img.extractedText ? (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                              <Check className="h-3 w-3" /> Text Extracted
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-3 h-8 text-[10px] gap-2" 
                              onClick={() => handlePerformOCR(img.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanText className="h-3 w-3" />}
                              Scan for Text (OCR)
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-muted-foreground opacity-30 text-center space-y-4 border-2 border-dashed rounded-xl">
                    <ImagesIcon className="h-16 w-16" />
                    <div>
                      <p className="text-lg font-headline font-bold">No visual resources yet.</p>
                      <p className="text-sm">Upload manuscript photos or archaeological maps to build your library.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bibles' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scripture Reader</h1>
                    <p className="text-muted-foreground">Digital library access for academic reading.</p>
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
                        <div className="flex justify-between items-center mb-10">
                           <h2 className="text-4xl font-bold font-headline">{currentPassage.bookName} {currentPassage.chapterNumber}</h2>
                           <Button variant="ghost" size="sm" onClick={captureSelectionToNotes}><Highlighter className="h-4 w-4 mr-2" /> Capture Highlight</Button>
                        </div>
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
                            <CardTitle className="text-lg mt-1 italic">{lexiconResult.transliteration} • [{lexiconResult.pronunciation}]</CardTitle>
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
                  <h1 className="text-3xl font-bold font-headline">Parallel Version Engine</h1>
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
                    <h1 className="text-3xl font-bold font-headline">Scholar AI Synthetic Chat</h1>
                    <p className="text-muted-foreground text-sm">Context-aware analysis across scripture and your library.</p>
                  </div>
                </header>

                <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl relative bg-card/50">
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6 max-w-3xl mx-auto py-4">
                      {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50 mt-20">
                          <div className="bg-primary/10 p-4 rounded-full"><Sparkles className="h-10 w-10 text-primary" /></div>
                          <p className="max-w-xs text-sm">Ask about eschatology, semantic ranges, or how your research papers align with historical commentaries.</p>
                          <Badge variant="outline" className="text-[10px] flex items-center gap-1">Using: {aiPrefs.selectedModel.split('/').pop()}</Badge>
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
                    <h1 className="text-3xl font-bold font-headline">Document Library</h1>
                    <p className="text-muted-foreground">Your custom research papers and text knowledge base.</p>
                  </div>
                  <div className="flex gap-2">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Plus className="h-4 w-4 mr-2" /> Add Document</Button>
                  </div>
                </header>
                <div className="grid gap-4 md:grid-cols-3">
                  {researchPapers.filter(p => !isImage(p.format)).map(paper => (
                    <Card key={paper.id} className="group overflow-hidden">
                      <div className={`h-1 w-full ${
                        paper.format === 'pdf' ? 'bg-red-500' : 
                        paper.format === 'docx' ? 'bg-blue-500' : 
                        'bg-gray-500'
                      }`} />
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-bold line-clamp-1">{paper.title}</CardTitle>
                          <Badge variant="secondary" className="text-[8px] uppercase">{paper.format}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-[10px] text-muted-foreground line-clamp-3 italic">Index ID: {paper.id} • {paper.date}</p></CardContent>
                      <CardFooter className="justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {driveFolderId && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => syncToDrive('paper', paper.id)}>
                            <CloudDownload className="h-3 w-3" />
                          </Button>
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
                    <p className="text-muted-foreground">Captured fragments and theological reflections.</p>
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
                  <h1 className="text-3xl font-bold font-headline">Scholar Writing Assistant</h1>
                  <p className="text-muted-foreground">Refine your academic drafts for seminary review.</p>
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
                    </div>
                    <Button className="w-full h-12" onClick={handleWritingRefinement} disabled={isLoading}><Sparkles className="h-5 w-5 mr-2" /> Refine Draft</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Scholarly Refinement</Label>
                    </div>
                    <Card className="min-h-[450px] bg-muted/5 p-6">
                      <ScrollArea className="h-full">
                        {writingResult ? (
                          <div className="space-y-6">
                            <p className="text-lg leading-relaxed">{writingResult.improvedText}</p>
                            <div className="border-t pt-4 space-y-3">
                              <h4 className="text-sm font-bold flex items-center gap-2"><Info className="h-4 w-4" /> Editorial Feedback</h4>
                              {writingResult.suggestions.map((s, i) => <p key={i} className="text-xs text-muted-foreground leading-normal">• {s}</p>)}
                            </div>
                          </div>
                        ) : <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30"><Type className="h-12 w-12 mb-2" /><p>AI refinement will appear here.</p></div>}
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
                  </div>
                </header>
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
              </div>
            )}
            
            {activeTab === 'integrity' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center"><h1 className="text-3xl font-bold font-headline">Integrity & Citation Scanner</h1><p className="text-muted-foreground">Ensure scholarly attribution for your theological works.</p></header>
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
                            <p className="font-bold text-destructive">Potential Attribution Issue: "{f.problematicText}"</p>
                            <p className="italic">Suggestion: {f.citationSuggestion}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t">
              <div 
                className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => handleAdClick('scholarly_resource_banner_main', 'footer_banner')}
              >
                <div className="flex flex-col items-center">
                  <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
                  <p className="text-xs text-muted-foreground italic">Your academic advertisement here</p>
                </div>
              </div>
            </div>

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

const isImage = (format: string) => ['png', 'jpg', 'jpeg', 'webp'].includes(format.toLowerCase());
