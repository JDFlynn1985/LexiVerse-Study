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
  ChevronRight
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { getVersions, type BibleVersion } from '@/lib/bible-api';

type ViewMode = 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers' | 'writing-assistant';

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

  const wordSearchId = useId();
  const dictSearchId = useId();
  const transSearchId = useId();
  const verseRefId = useId();
  const chatInputId = useId();
  const writingInputId = useId();

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [biblioItems, setBiblioItems] = useState<BiblioItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null);

  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [wordResult, setWordResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [dictTerm, setDictTerm] = useState('');
  const [dictResult, setDictResult] = useState<{term: string, definition: string, sources: string[]} | null>(null);
  const [transWord, setTransWord] = useState('');
  const [transResult, setTransResult] = useState<CompareTranslationsOutput | null>(null);
  const [verseRef, setVerseRef] = useState('');
  const [verseExploration, setVerseExploration] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);

  // Writing Assistant States
  const [writingInput, setWritingInput] = useState('');
  const [writingResult, setWritingResult] = useState<WritingAssistantOutput | null>(null);

  // Bibliography States
  const [biblioStyle, setBiblioStyle] = useState<'SBL' | 'Turabian' | 'Chicago' | 'APA' | 'MLA'>('SBL');
  const [formattedBiblioResult, setFormattedBiblioResult] = useState<FormatBibliographyOutput | null>(null);

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
      
      setDoc(userRef, userData, { merge: true })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });

      toast({
        title: "Logged in",
        description: `Welcome back, ${result.user.displayName}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setGoogleAccessToken(null);
    toast({ title: "Logged out" });
  };

  const listDriveFiles = async () => {
    if (!googleAccessToken) return;
    setIsFetchingDrive(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id, name, mimeType)`,
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        }
      );
      const data = await response.json();
      setDriveFiles(data.files || []);
      setIsDriveModalOpen(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Drive Access Error",
        description: "Could not retrieve your Google Drive files.",
      });
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const importDriveFile = async (file: DriveFile) => {
    if (!googleAccessToken) return;
    setIsLoading(true);
    try {
      let content = "";
      let format: ResearchPaper['format'] = 'gdoc';

      if (file.mimeType === 'application/vnd.google-apps.document') {
        const res = await fetch(`https://docs.googleapis.com/v1/documents/${file.id}`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        const docRes = await res.json();
        content = docRes.body.content.map((c: any) => {
          if (c.paragraph) {
            return c.paragraph.elements.map((e: any) => e.textRun?.content || "").join("");
          }
          return "";
        }).join("\n");
        format = 'gdoc';
      } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${file.id}/values/A1:Z100`, {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        });
        const sheet = await res.json();
        content = sheet.values?.map((row: string[]) => row.join("\t")).join("\n") || "";
        format = 'gsheet';
      }

      const newPaper: ResearchPaper = {
        id: Date.now().toString(),
        title: file.name,
        content,
        format,
        date: new Date().toLocaleString()
      };

      const updated = [newPaper, ...researchPapers];
      setResearchPapers(updated);
      localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
      setIsDriveModalOpen(false);
      toast({
        title: "Import Successful",
        description: `"${file.name}" added to your knowledge base.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToGoogleKeep = (content: string, title: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied for Google Keep",
      description: "Content is on your clipboard. Opening Google Keep...",
    });
    window.open('https://keep.google.com/', '_blank');
  };

  const exportToGoogleDocs = async (title: string, content: string) => {
    if (!googleAccessToken) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login with Google to export directly to Docs.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to create document');
      const docRes = await response.json();
      
      await fetch(`https://docs.googleapis.com/v1/documents/${docRes.documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            insertText: {
              location: { index: 1 },
              text: content
            }
          }]
        }),
      });

      toast({
        title: "Exported to Google Docs",
        description: `"${title}" has been created in your Drive.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => window.open(`https://docs.google.com/document/d/${docRes.documentId}/edit`, '_blank')}>
            Open Doc
          </Button>
        ),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToGoogleSheets = async (title: string, data: BiblioItem[]) => {
    if (!googleAccessToken) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login with Google to export directly to Sheets.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title }
        }),
      });

      if (!response.ok) throw new Error('Failed to create spreadsheet');
      const sheet = await response.json();
      const spreadsheetId = sheet.spreadsheetId;

      const values = [
        ['Citation', 'Source Type', 'Date Captured'],
        ...data.map(item => [item.citation, item.sourceType, item.date])
      ];

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });

      toast({
        title: "Exported to Google Sheets",
        description: `"${title}" created in your Drive.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank')}>
            Open Sheet
          </Button>
        ),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToHistory = (type: string, term: string) => {
    if (!term.trim()) return;
    const newEntry = { id: Date.now().toString(), type, term, date: new Date().toLocaleString() };
    const updatedHistory = [newEntry, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    localStorage.setItem('lexiverse_history', JSON.stringify(updatedHistory));
  };

  const handleSaveNote = (content: string, source: string = "Selection") => {
    if (!content.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      content: content.trim(),
      source,
      date: new Date().toLocaleString()
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem('lexiverse_notes', JSON.stringify(updated));
    toast({
      title: "Note Saved",
      description: "Text added to your personal research notes.",
    });
  };

  const handleSaveToBiblio = (citation: string, type: string = "Research Source") => {
    if (!citation.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      citation: citation.trim(),
      sourceType: type,
      date: new Date().toLocaleString()
    };
    const updated = [newItem, ...biblioItems];
    setBiblioItems(updated);
    localStorage.setItem('lexiverse_biblio', JSON.stringify(updated));
    toast({
      title: "Citation Added",
      description: "Source added to your academic bibliography.",
    });
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer) => {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (error) {
      throw new Error('Failed to parse PDF file.');
    }
  };

  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to parse Word document.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    try {
      let content = '';
      let format: ResearchPaper['format'] = 'txt';

      if (extension === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractTextFromPdf(arrayBuffer);
        format = 'pdf';
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractTextFromDocx(arrayBuffer);
        format = 'docx';
      } else {
        content = await file.text();
        format = 'txt';
      }

      const newPaper: ResearchPaper = {
        id: Date.now().toString(),
        title: fileName,
        content: content,
        format,
        date: new Date().toLocaleString()
      };

      const updated = [newPaper, ...researchPapers];
      setResearchPapers(updated);
      localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
      toast({
        title: "Paper Uploaded",
        description: `"${fileName}" has been processed and added to your research library.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Could not process the uploaded file.",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const captureSelectionToNotes = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      handleSaveNote(selection, currentContext || "Active Study");
    } else {
      toast({
        variant: "destructive",
        title: "No Text Selected",
        description: "Highlight text on the screen first to capture it as a note.",
      });
    }
  };

  const askScholarAboutContext = (content: string, type: string) => {
    const prompt = `Can you explain the significance and context of this ${type}: "${content}"?`;
    setChatInput(prompt);
    setActiveTab('scholar-ai');
  };

  async function handleWordSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const data = await defineAndAnalyzeTerm({ strongsNumber: searchTerm });
      setWordResult(data);
      setCurrentContext(`Word Study: ${data.originalWord} (${data.transliteration})`);
      addToHistory('lexicon', searchTerm);
      setActiveTab('lexicon');
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDictionarySearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!dictTerm.trim()) return;
    setIsLoading(true);
    try {
      const data = await interactiveVerseExplorationAI({
        term: dictTerm,
        question: `Define the biblical and theological term "${dictTerm}". Provide historical context and major dictionary references.`,
        history: [],
        researchContext: researchPapers.map(p => p.content)
      });
      setDictResult({
        term: dictTerm,
        definition: data.response,
        sources: ['Scholarly AI Synthesis', "Theological Dictionary"]
      });
      setCurrentContext(`Dictionary: ${dictTerm}`);
      addToHistory('dictionaries', dictTerm);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTranslationCompare(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!transWord.trim()) return;
    setIsLoading(true);
    try {
      const data = await compareTranslations({ 
        word: transWord, 
        language: 'Auto-detect', 
        versions: ['KJV', 'NIV', 'ESV', 'NASB'] 
      });
      setTransResult(data);
      setCurrentContext(`Translation Comparison: ${transWord}`);
      addToHistory('translations', transWord);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerseExploration(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!verseRef.trim()) return;
    setIsLoading(true);
    try {
      const data = await interactiveVerseExplorationAI({
        term: verseRef,
        question: `Explain the theological significance of ${verseRef} in its original context.`,
        history: [],
        researchContext: researchPapers.map(p => p.content)
      });
      setVerseExploration(data.response);
      setCurrentContext(`Verse Analysis: ${verseRef}`);
      addToHistory('verse-explorer', verseRef);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAIChat(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsLoading(true);
    try {
      const data = await interactiveVerseExplorationAI({
        term: currentContext || 'General Biblical Research',
        question: userMsg,
        history: chatHistory,
        researchContext: researchPapers.map(p => p.content)
      });
      setChatHistory(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWritingRefinement(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!writingInput.trim()) return;
    setIsLoading(true);
    try {
      const data = await refineWriting({ text: writingInput, mode: 'academic' });
      setWritingResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Refinement Failed', description: 'AI could not process the text.' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBiblioFormatting() {
    if (biblioItems.length === 0) {
      toast({ variant: 'destructive', title: 'Bibliography Empty', description: 'Add sources to your bibliography before formatting.' });
      return;
    }
    setIsLoading(true);
    try {
      const data = await formatBibliography({ 
        items: biblioItems.map(item => item.citation), 
        style: biblioStyle 
      });
      setFormattedBiblioResult(data);
      toast({ title: "Formatting Complete", description: `Applied ${biblioStyle} formatting to your research log.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Formatting Failed', description: 'AI could not process the bibliography.' });
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon" role="navigation" aria-label="Main Navigation">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md" aria-hidden="true">
                <Globe className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">LexiVerse</span>
            </div>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Digital Library</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'bibles', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'commentaries', label: 'Commentaries', icon: Scroll },
                    { id: 'dictionaries', label: 'Dictionaries', icon: Library },
                    { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
                    { id: 'papers', label: 'Research Papers', icon: FileSearch },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-label={`Go to ${item.label}`}
                      >
                        <item.icon className="mr-2 h-5 w-5" aria-hidden="true" /> 
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Research Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'translations', label: 'Comparisons', icon: Scale },
                    { id: 'verse-explorer', label: 'Verse Explorer', icon: Quote },
                    { id: 'writing-assistant', label: 'Writing AI', icon: SpellCheck },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-label={`Go to ${item.label}`}
                      >
                        <item.icon className="mr-2 h-5 w-5" aria-hidden="true" /> 
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Study Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'notes', label: 'My Notes', icon: Edit3 },
                    { id: 'bibliography', label: 'Bibliography', icon: ClipboardList },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-label={`Go to ${item.label}`}
                      >
                        <item.icon className="mr-2 h-5 w-5" aria-hidden="true" /> 
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>AI Engine</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'scholar-ai', label: 'Scholar AI', icon: Mic },
                    { id: 'history', label: 'Research Logs', icon: History },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-label={`Go to ${item.label}`}
                      >
                        <item.icon className="mr-2 h-5 w-5" aria-hidden="true" /> 
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-4 border-t gap-4">
             {user ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="w-full justify-start px-2 py-6" aria-label="User Profile Menu">
                     <div className="flex items-center gap-3">
                       <img src={user.photoURL || ''} className="h-8 w-8 rounded-full border" alt="" />
                       <div className="flex flex-col items-start overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                         <span className="text-sm font-semibold truncate w-full">{user.displayName}</span>
                         <span className="text-xs text-muted-foreground truncate w-full">Academic Account</span>
                       </div>
                     </div>
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56">
                   <DropdownMenuLabel>Google Integration</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => setActiveTab('notes')}>Manage Notes</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => setActiveTab('bibliography')}>Study Bibliography</DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                     <LogOut className="h-4 w-4 mr-2" /> Logout
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             ) : (
               <Button variant="outline" className="w-full justify-start gap-2 group-data-[collapsible=icon]:p-2" onClick={handleLogin}>
                 <Globe className="h-4 w-4" aria-hidden="true" />
                 <span className="group-data-[collapsible=icon]:hidden">Link Google Account</span>
               </Button>
             )}
             
             <div className="flex justify-between items-center group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] text-muted-foreground uppercase">LexiVerse v3.0</span>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
             </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background overflow-y-auto">
          <div className="fixed top-4 right-8 z-50 flex gap-2">
            <Button variant="secondary" className="shadow-lg h-10 border" onClick={captureSelectionToNotes}>
              <Highlighter className="h-4 w-4 mr-2" aria-hidden="true" /> Capture Highlight
            </Button>
          </div>

          <main className="container max-w-5xl mx-auto py-10 px-6" id="main-content" role="main">
            {activeTab === 'bibles' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex flex-col md:flex-row md:justify-between md:items-end border-b pb-6 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Study Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back. Continue your research where you left off.</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="px-3 py-1 flex gap-1">
                      <Sparkles className="h-3 w-3" /> Scholarship Active
                    </Badge>
                  </div>
                </header>

                <div className="grid gap-6 md:grid-cols-3">
                   <Card className="bg-primary text-primary-foreground shadow-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <History className="h-4 w-4" /> Recent Session
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {history.length > 0 ? (
                          <div className="space-y-1">
                            <p className="font-bold text-lg truncate">{history[0].term}</p>
                            <p className="text-xs opacity-70">Analyzed in {history[0].type}</p>
                          </div>
                        ) : (
                          <p className="text-sm opacity-70 italic">No recent history</p>
                        )}
                      </CardContent>
                      <CardFooter className="pt-0">
                         <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setActiveTab('history')}>View Logs</Button>
                      </CardFooter>
                   </Card>

                   <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Edit3 className="h-4 w-4" /> Notes Captured
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{notes.length}</p>
                        <p className="text-xs text-muted-foreground">Fragments saved</p>
                      </CardContent>
                   </Card>

                   <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Research Library
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">{researchPapers.length}</p>
                        <p className="text-xs text-muted-foreground">Papers & G-Docs indexed</p>
                      </CardContent>
                   </Card>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-headline">Available Scripture Modules</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {versions.length > 0 ? versions.map((v) => (
                      <Card key={v.id} className="hover:border-primary transition-all cursor-pointer group">
                        <CardHeader className="pb-3">
                          <Badge variant="outline" className="w-fit mb-2 uppercase">{v.language}</Badge>
                          <CardTitle className="text-lg">{v.name}</CardTitle>
                          <CardDescription>{v.abbreviation}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            Launch Reader <ExternalLink className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    )) : (
                      <div className="col-span-full py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Syncing available versions...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bibliography' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Bibliography Manager</h1>
                    <p className="text-muted-foreground">Manage and format citations according to academic standards.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={biblioStyle} onValueChange={(val: any) => setBiblioStyle(val)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SBL">SBL (Society of Biblical Lit)</SelectItem>
                        <SelectItem value="Chicago">Chicago (Author-Date)</SelectItem>
                        <SelectItem value="Turabian">Turabian (Notes-Biblio)</SelectItem>
                        <SelectItem value="APA">APA 7th Edition</SelectItem>
                        <SelectItem value="MLA">MLA 9th Edition</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBiblioFormatting} disabled={isLoading || biblioItems.length === 0} className="shadow-md">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                      Generate Formatted
                    </Button>
                  </div>
                </header>

                <div className="grid gap-8 lg:grid-cols-[1fr,350px]">
                  <div className="space-y-6">
                    {formattedBiblioResult ? (
                      <Card className="shadow-lg border-primary/20">
                        <CardHeader className="bg-primary/5 border-b flex flex-row justify-between items-center">
                          <div>
                            <CardTitle className="text-lg font-headline">Formatted Bibliography</CardTitle>
                            <CardDescription>Generated in {formattedBiblioResult.styleApplied} Style</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(formattedBiblioResult.formattedBibliography);
                              toast({ title: "Copied to Clipboard" });
                            }}>
                              <Copy className="h-4 w-4 mr-2" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => exportToGoogleDocs(`Bibliography (${biblioStyle})`, formattedBiblioResult.formattedBibliography)}>
                              <ExternalLink className="h-4 w-4 mr-2" /> Export Doc
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-8">
                          <div className="prose dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap leading-loose font-serif text-lg">{formattedBiblioResult.formattedBibliography}</p>
                          </div>
                          
                          {formattedBiblioResult.formattingNotes.length > 0 && (
                            <div className="mt-8 pt-6 border-t">
                              <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                                <Info className="h-4 w-4" /> Formatting Nuances
                              </h4>
                              <ul className="space-y-2">
                                {formattedBiblioResult.formattingNotes.map((note, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                    <ChevronRight className="h-3 w-3 shrink-0 text-primary" /> {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-4 justify-between border-t">
                          <p className="text-[10px] text-muted-foreground">Standard applied: {biblioStyle === 'SBL' ? 'SBL 2nd Edition' : biblioStyle}</p>
                          <Button variant="ghost" size="sm" onClick={() => setFormattedBiblioResult(null)}>Reset View</Button>
                        </CardFooter>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold font-headline">Study Resource Log</h2>
                        {biblioItems.length === 0 ? (
                          <div className="text-center py-20 bg-muted/20 border-dashed border-2 rounded-xl">
                            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground">Your bibliography is empty. Add sources from the Lexicon or Dictionary.</p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {biblioItems.map(item => (
                              <Card key={item.id} className="group">
                                <CardContent className="p-4 flex justify-between items-center">
                                  <div className="space-y-1">
                                    <div className="flex gap-2 items-center">
                                      <Badge variant="secondary" className="text-[10px] uppercase">{item.sourceType}</Badge>
                                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                                    </div>
                                    <p className="text-sm font-medium">{item.citation}</p>
                                  </div>
                                  <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                    const updated = biblioItems.filter(i => i.id !== item.id);
                                    setBiblioItems(updated);
                                    localStorage.setItem('lexiverse_biblio', JSON.stringify(updated));
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <aside className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Bibliography Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => exportToGoogleSheets("My Study Bibliography", biblioItems)} disabled={biblioItems.length === 0}>
                          <TableIcon className="h-4 w-4" /> Export to Google Sheets
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10" onClick={() => {
                          setBiblioItems([]);
                          localStorage.removeItem('lexiverse_biblio');
                          setFormattedBiblioResult(null);
                        }} disabled={biblioItems.length === 0}>
                          <Trash2 className="h-4 w-4" /> Clear Bibliography
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/20">
                      <CardHeader>
                        <CardTitle className="text-xs uppercase text-muted-foreground">Style Guides</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-3 leading-relaxed">
                        <p><strong>SBL Style</strong> is the standard for Biblical Studies, based on Chicago 17th with specific adaptations for theological journals.</p>
                        <p><strong>Turabian</strong> is commonly required for seminary graduate papers and focuses on clear note-taking.</p>
                      </CardContent>
                    </Card>
                  </aside>
                </div>
              </div>
            )}

            {activeTab === 'writing-assistant' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center">
                  <h1 className="text-3xl font-bold font-headline">Academic Writing Assistant</h1>
                  <p className="text-muted-foreground">Refine your research notes and papers for academic rigor.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <Label htmlFor={writingInputId}>Input Draft</Label>
                    <Textarea 
                      id={writingInputId}
                      placeholder="Paste your research summary or paper fragment here..." 
                      className="min-h-[400px] shadow-sm leading-relaxed"
                      value={writingInput}
                      onChange={(e) => setWritingInput(e.target.value)}
                    />
                    <Button 
                      className="w-full h-12 text-lg shadow-lg" 
                      onClick={handleWritingRefinement}
                      disabled={isLoading || !writingInput.trim()}
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                      Refine Content
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Label>Refined Scholarly Output</Label>
                    <Card className="min-h-[400px] flex flex-col bg-muted/20 border-dashed">
                      <ScrollArea className="flex-1 p-6">
                        {writingResult ? (
                          <div className="space-y-6">
                            <div className="prose dark:prose-invert max-w-none">
                              <p className="text-lg leading-relaxed">{writingResult.improvedText}</p>
                            </div>

                            {writingResult.corrections.length > 0 && (
                              <div className="space-y-3 pt-6 border-t">
                                <h3 className="font-bold flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-primary" /> Technical Corrections
                                </h3>
                                {writingResult.corrections.map((c, i) => (
                                  <div key={i} className="text-sm p-3 bg-card border rounded-lg">
                                    <span className="line-through text-destructive">{c.original}</span>
                                    <span className="mx-2 text-muted-foreground">→</span>
                                    <span className="font-bold text-primary">{c.replacement}</span>
                                    <p className="text-xs text-muted-foreground mt-1 italic">{c.reason}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {writingResult.suggestions.length > 0 && (
                              <div className="space-y-3 pt-6 border-t">
                                <h3 className="font-bold flex items-center gap-2">
                                  <ClipboardList className="h-4 w-4 text-primary" /> Academic Suggestions
                                </h3>
                                <ul className="list-disc pl-4 space-y-1">
                                  {writingResult.suggestions.map((s, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <SpellCheck className="h-12 w-12 mb-4" />
                            <p className="text-center italic">Refined text and scholarly suggestions will appear here.</p>
                          </div>
                        )}
                      </ScrollArea>
                      {writingResult && (
                        <CardFooter className="border-t bg-muted/30 p-4 flex gap-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleSaveNote(writingResult.improvedText, "AI Refined Writing")}>
                            Save as Note
                          </Button>
                          <Button variant="outline" size="sm" className="w-full" onClick={() => {
                            navigator.clipboard.writeText(writingResult.improvedText);
                            toast({ title: "Copied to Clipboard" });
                          }}>
                            Copy Result
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lexicon' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="text-center py-10">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-4">Semantic Lexicon</h1>
                  <div className="max-w-md mx-auto">
                    <form onSubmit={handleWordSearch} className="flex gap-2" role="search">
                      <Label htmlFor={wordSearchId} className="sr-only">Search Strong's Number</Label>
                      <Input 
                        id={wordSearchId}
                        placeholder="Strong's (e.g. G3056)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 shadow-sm"
                        aria-label="Input Strong's Greek or Hebrew number"
                      />
                      <Button type="submit" size="lg" disabled={isLoading} aria-label="Perform word search">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </form>
                  </div>
                </div>

                {wordResult && (
                  <article className="space-y-6 animate-in slide-in-from-bottom-4">
                    <header className="flex justify-between items-center border-b pb-6">
                      <div>
                        <h2 className="text-5xl font-bold font-headline text-primary">{wordResult.originalWord}</h2>
                        <p className="text-xl text-muted-foreground italic mt-1">
                          {wordResult.transliteration} • {wordResult.pronunciation}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-accent text-accent-foreground px-4 py-1 text-md">
                          {wordResult.searchStrongNumber}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSaveToBiblio(`Strong's ${wordResult.searchStrongNumber}: ${wordResult.originalWord}`, "Lexicon")}>
                            Cite <ClipboardList className="h-3 w-3 ml-2" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => askScholarAboutContext(`${wordResult.originalWord} (${wordResult.searchStrongNumber})`, 'Lexicon Term')}>
                            Ask AI <Mic className="h-3 w-3 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </header>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-primary/5 flex flex-row justify-between items-center">
                          <CardTitle className="text-lg font-headline">Lexical Definition</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveNote(wordResult.definition, `Lexicon: ${wordResult.originalWord}`)} aria-label="Save definition to notes">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="pt-6"><p className="leading-relaxed text-lg">{wordResult.definition}</p></CardContent>
                      </Card>
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-primary/5"><CardTitle className="text-lg font-headline">Grammar & Parsing</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                          <pre className="text-xs bg-muted/50 p-4 rounded font-mono overflow-auto border" aria-label="Grammatical parsing data">{wordResult.lexicalData}</pre>
                        </CardContent>
                      </Card>
                    </div>
                  </article>
                )}
              </div>
            )}

            {activeTab === 'papers' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Knowledge Base</h1>
                    <p className="text-muted-foreground">Import your research from Local Files or Google Drive.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload}
                      accept=".txt,.md,.pdf,.docx"
                      aria-label="Upload research paper"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                      <Plus className="h-4 w-4 mr-2" /> Upload File
                    </Button>
                    <Button onClick={listDriveFiles} disabled={isLoading || !googleAccessToken || isFetchingDrive}>
                      {isFetchingDrive ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CloudDownload className="h-4 w-4 mr-2" />} 
                      Import from Drive
                    </Button>
                  </div>
                </header>

                <Dialog open={isDriveModalOpen} onOpenChange={setIsDriveModalOpen}>
                  <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Import from Google Drive</DialogTitle>
                      <DialogDescription>Select a Google Doc or Spreadsheet to include in your AI research context.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4">
                      <div className="space-y-2">
                        {driveFiles.length === 0 ? (
                          <div className="py-10 text-center text-muted-foreground">
                            <FileWarning className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No compatible Docs or Sheets found in your Drive.</p>
                          </div>
                        ) : (
                          driveFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => importDriveFile(file)} role="button" aria-label={`Import ${file.name}`}>
                              <div className="flex items-center gap-3">
                                {file.mimeType.includes('document') ? <FileText className="h-5 w-5 text-blue-500" /> : <TableIcon className="h-5 w-5 text-green-500" />}
                                <span className="font-medium text-sm">{file.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Import</Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsDriveModalOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {researchPapers.length === 0 ? (
                  <Card className="border-dashed py-20 text-center">
                    <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="text-muted-foreground">No papers uploaded. Add PDFs, Word docs, or Google Drive content.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {researchPapers.map(paper => (
                      <Card key={paper.id} className="hover:border-primary transition-colors">
                        <CardHeader className="pb-2 flex flex-row justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                              {paper.format === 'pdf' && <FileText className="h-4 w-4 text-red-500" />}
                              {paper.format === 'docx' && <FileCode className="h-4 w-4 text-blue-500" />}
                              {paper.format === 'gdoc' && <FileText className="h-4 w-4 text-blue-600" />}
                              {paper.format === 'gsheet' && <TableIcon className="h-4 w-4 text-green-600" />}
                              {paper.format === 'txt' && <FileText className="h-4 w-4 text-muted-foreground" />}
                              {paper.title}
                            </CardTitle>
                            <CardDescription>{paper.date}</CardDescription>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                            const updated = researchPapers.filter(p => p.id !== paper.id);
                            setResearchPapers(updated);
                            localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
                          }} aria-label={`Delete ${paper.title}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-3 italic">"{paper.content.substring(0, 250)}..."</p>
                        </CardContent>
                        <CardFooter className="pt-0 flex gap-2">
                           <Badge variant="secondary" className="flex gap-1 items-center">
                            <Check className="h-3 w-3" /> Scanned & Indexed
                           </Badge>
                           <Badge variant="outline" className="uppercase text-[10px]">{paper.format}</Badge>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dictionaries' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center">
                  <h1 className="text-3xl font-bold font-headline">Theological Dictionaries</h1>
                  <p className="text-muted-foreground">Thematic definitions and historical concepts.</p>
                </header>
                <Card className="max-w-2xl mx-auto shadow-md border-t-4 border-t-primary">
                  <CardContent className="pt-6">
                    <form onSubmit={handleDictionarySearch} className="flex gap-2">
                      <Input 
                        id={dictSearchId}
                        placeholder="Search term (e.g. Tabernacle, Grace, Covenant)" 
                        value={dictTerm}
                        onChange={(e) => setDictTerm(e.target.value)}
                        className="h-12"
                      />
                      <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" />}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {dictResult && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <Card className="shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
                        <div>
                          <CardTitle className="text-3xl font-headline text-primary uppercase tracking-tight">{dictResult.term}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            {dictResult.sources.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleSaveToBiblio(`Theological Dictionary Entry: ${dictResult.term}`, "Dictionary")}>
                            Cite <ClipboardList className="h-4 w-4 ml-2" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => askScholarAboutContext(dictResult.definition, `Dictionary entry for ${dictResult.term}`)}>
                            Analyze <Mic className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-8">
                        <div className="prose dark:prose-invert max-w-none">
                          <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{dictResult.definition}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'scholar-ai' && (
              <div className="flex flex-col h-[80vh] gap-4 animate-in fade-in">
                <header className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h1 className="text-2xl font-bold font-headline">Scholar AI Engine</h1>
                    <p className="text-sm text-muted-foreground">Context: <span className="text-primary font-medium">{currentContext || 'General Research'}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" /> Export Log
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportToGoogleDocs(`Scholar AI Session: ${currentContext}`, chatHistory.map(m => `${m.role.toUpperCase()}:\n${m.content}\n\n`).join(''))}>
                          <FileText className="h-4 w-4 mr-2" /> Send to Google Docs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToGoogleKeep(chatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n'), "AI Chat Log")}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Copy to Keep
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" onClick={() => {setChatHistory([]); setCurrentContext(null);}} className="text-destructive">
                      Clear Session <Trash2 className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </header>
                
                <Card className="flex-1 flex flex-col bg-muted/5 shadow-inner border-none overflow-hidden">
                  <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6 max-w-3xl mx-auto">
                      {chatHistory.length === 0 && (
                        <div className="text-center py-32 text-muted-foreground animate-in zoom-in-95">
                          <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-10" />
                          <h3 className="text-xl font-headline mb-2">How can I assist your research?</h3>
                          <p className="text-sm">Ask about passages, translation nuances, or historical context.</p>
                        </div>
                      )}
                      {chatHistory.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm relative group ${
                            m.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-card border rounded-tl-none'
                          }`}>
                            <p className="text-md whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            {m.role === 'model' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute -right-10 top-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleSaveNote(m.content, `Scholar AI: ${currentContext || 'Response'}`)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-card border p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm font-medium italic">Scholar is analyzing...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                <form onSubmit={handleAIChat} className="flex gap-3 max-w-3xl mx-auto w-full">
                  <div className="flex-1 relative">
                    <Input 
                      id={chatInputId}
                      placeholder="Ask the Scholar AI anything..." 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="h-14 pr-12 rounded-xl shadow-lg"
                      autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Mic className="h-5 w-5 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                  <Button type="submit" size="icon" disabled={isLoading || !chatInput.trim()} className="h-14 w-14 rounded-xl shadow-lg">
                    <Send className="h-6 w-6" />
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">My Research Notes</h1>
                    <p className="text-muted-foreground">Captured fragments and study reflections.</p>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Share2 className="h-4 w-4 mr-2" /> Export Notes
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => exportToGoogleKeep(notes.map(n => n.content).join('\n\n'), "My Research Notes")}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Copy to Google Keep
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToGoogleDocs("LexiVerse Study Notes", notes.map(n => `${n.source} (${n.date}):\n${n.content}\n\n`).join(''))}>
                          <FileText className="h-4 w-4 mr-2" /> Export to Google Docs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" onClick={() => { setNotes([]); localStorage.removeItem('lexiverse_notes'); }}>
                      Clear All <Trash2 className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </header>
                
                {notes.length === 0 ? (
                  <Card className="border-dashed py-20 text-center">
                    <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="text-muted-foreground">No notes captured yet. Highlight text anywhere to save it.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {notes.map(note => (
                      <Card key={note.id} className="group hover:border-primary transition-all">
                        <CardHeader className="pb-2 flex flex-row justify-between items-start">
                          <div>
                            <Badge variant="outline" className="text-[10px] uppercase">{note.source}</Badge>
                            <p className="text-[10px] text-muted-foreground mt-1">{note.date}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                            const updated = notes.filter(n => n.id !== note.id);
                            setNotes(updated);
                            localStorage.setItem('lexiverse_notes', JSON.stringify(updated));
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm italic leading-relaxed text-muted-foreground whitespace-pre-wrap">"{note.content}"</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
