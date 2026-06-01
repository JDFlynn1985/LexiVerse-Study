'use client';

import { useState, useEffect, useId, useRef } from 'react';
import { useTheme } from 'next-themes';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';

// Set up PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInput, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarProvider, 
  SidebarRail, 
  SidebarInset, 
  SidebarFooter 
} from '@/components/ui/sidebar';
import { 
  Search, 
  BookOpen, 
  Scroll, 
  Feather, 
  FileText, 
  Info, 
  Mic, 
  Puzzle,
  Loader2,
  BookMarked,
  Languages,
  MessageSquare,
  History,
  Send,
  Download,
  CheckCircle2,
  Trash2,
  Bookmark,
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
  SpellCheck,
  ClipboardList,
  Edit3,
  Highlighter,
  Plus,
  Copy,
  FileUp,
  FileSearch,
  Check,
  FileCode,
  LogOut,
  FileJson,
  Table as TableIcon,
  CloudDownload,
  FileWarning
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { interactiveVerseExplorationAI } from '@/ai/flows/interactive-verse-exploration-ai';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { initializeFirebase } from '@/firebase';

type ViewMode = 'bibles' | 'commentaries' | 'dictionaries' | 'lexicon' | 'translations' | 'verse-explorer' | 'scholar-ai' | 'history' | 'notes' | 'bibliography' | 'papers';

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
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Accessibility IDs
  const wordSearchId = useId();
  const dictSearchId = useId();
  const transSearchId = useId();
  const verseRefId = useId();
  const chatInputId = useId();

  // State Management
  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [biblioItems, setBiblioItems] = useState<BiblioItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [currentContext, setCurrentContext] = useState<string | null>(null);

  // Drive Import State
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);

  // Content States
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

  useEffect(() => {
    setMounted(true);
    const { auth } = initializeFirebase();
    
    onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

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
    const { auth } = initializeFirebase();
    const provider = new GoogleAuthProvider();
    // Request broader scopes for reading and managing files
    provider.addScope('https://www.googleapis.com/auth/documents.readonly');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
    provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    provider.addScope('https://www.googleapis.com/auth/documents');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      setGoogleAccessToken(credential?.accessToken || null);
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
    const { auth } = initializeFirebase();
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
        const doc = await res.json();
        content = doc.body.content.map((c: any) => {
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
      const doc = await response.json();
      
      await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
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
          <Button variant="outline" size="sm" onClick={() => window.open(`https://docs.google.com/document/d/${doc.documentId}/edit`, '_blank')}>
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
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to parse PDF file.');
    }
  };

  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md">
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
                    { id: 'bibles', label: 'Bibles', icon: Book },
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
                      >
                        <item.icon className="mr-2 h-5 w-5" /> 
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
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                      >
                        <item.icon className="mr-2 h-5 w-5" /> 
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
                      >
                        <item.icon className="mr-2 h-5 w-5" /> 
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
                      >
                        <item.icon className="mr-2 h-5 w-5" /> 
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
                   <Button variant="ghost" className="w-full justify-start px-2 py-6">
                     <div className="flex items-center gap-3">
                       <img src={user.photoURL || ''} className="h-8 w-8 rounded-full border" alt="Avatar" />
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
                 <Globe className="h-4 w-4" />
                 <span className="group-data-[collapsible=icon]:hidden">Link Google Account</span>
               </Button>
             )}
             
             <div className="flex justify-between items-center group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] text-muted-foreground uppercase">LexiVerse v2.8</span>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
             </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background overflow-y-auto">
          {/* Global Tool Overlay */}
          <div className="fixed top-4 right-8 z-50 flex gap-2">
            <Button variant="secondary" className="shadow-lg h-10 border" onClick={captureSelectionToNotes}>
              <Highlighter className="h-4 w-4 mr-2" /> Capture Highlight
            </Button>
          </div>

          <main className="container max-w-5xl mx-auto py-10 px-6" id="main-content">
            
            {activeTab === 'bibles' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex justify-between items-end border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Scripture Modules</h1>
                    <p className="text-muted-foreground">Select a version to begin reading and analysis.</p>
                  </div>
                </header>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {versions.length > 0 ? versions.map((v) => (
                    <Card key={v.id} className="hover:border-primary transition-all cursor-pointer group">
                      <CardHeader className="pb-3">
                        <Badge variant="outline" className="w-fit mb-2">{v.language.toUpperCase()}</Badge>
                        <CardTitle className="text-lg">{v.name}</CardTitle>
                        <CardDescription>{v.abbreviation}</CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Open Text <ExternalLink className="h-4 w-4" />
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
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => importDriveFile(file)}>
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
                          }}>
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

            {activeTab === 'commentaries' && (
              <div className="space-y-6 animate-in fade-in">
                <header>
                  <h1 className="text-3xl font-bold font-headline">Commentary Research</h1>
                  <p className="text-muted-foreground">Synthesized historical and linguistic context.</p>
                </header>
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-12 text-center">
                    <Feather className="h-12 w-12 mx-auto mb-4 opacity-20 text-primary" />
                    <h3 className="font-bold text-lg mb-2">Integrated Research Mode</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                      Use the Verse Explorer or Scholar AI to generate academic commentary insights.
                    </p>
                    <Button onClick={() => setActiveTab('verse-explorer')}>
                      Go to Verse Explorer
                    </Button>
                  </CardContent>
                </Card>
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

            {activeTab === 'lexicon' && (
              <div className="space-y-8 animate-in fade-in">
                <div className="text-center py-10">
                  <h1 className="text-4xl font-bold font-headline text-primary mb-4">Semantic Lexicon</h1>
                  <div className="max-w-md mx-auto">
                    <form onSubmit={handleWordSearch} className="flex gap-2">
                      <Input 
                        id={wordSearchId}
                        placeholder="Strong's (e.g. G3056)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 shadow-sm"
                      />
                      <Button type="submit" size="lg" disabled={isLoading}>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveNote(wordResult.definition, `Lexicon: ${wordResult.originalWord}`)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="pt-6"><p className="leading-relaxed text-lg">{wordResult.definition}</p></CardContent>
                      </Card>
                      <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-primary/5"><CardTitle className="text-lg font-headline">Grammar & Parsing</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                          <pre className="text-xs bg-muted/50 p-4 rounded font-mono overflow-auto border">{wordResult.lexicalData}</pre>
                        </CardContent>
                      </Card>
                    </div>
                  </article>
                )}
              </div>
            )}

            {activeTab === 'translations' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center">
                  <h1 className="text-3xl font-bold font-headline mb-2">Comparative Translations</h1>
                  <p className="text-muted-foreground">Examine term variations across major versions.</p>
                </header>
                <Card className="max-w-2xl mx-auto shadow-md border-t-4 border-t-accent">
                  <CardContent className="pt-6">
                    <form onSubmit={handleTranslationCompare} className="flex gap-2">
                      <Input 
                        id={transSearchId}
                        placeholder="Word to compare (e.g. Logos, Love, Grace)" 
                        value={transWord}
                        onChange={(e) => setTransWord(e.target.value)}
                        className="h-12"
                      />
                      <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {transResult && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <Card className="bg-accent/5 border-accent/20">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="font-headline text-2xl">Linguistic Synthesis</CardTitle>
                        <div className="flex gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleSaveToBiblio(`Comparative Analysis: ${transResult.originalWord}`, "Translation Study")}>
                            Cite <ClipboardList className="h-4 w-4 ml-2" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => askScholarAboutContext(transResult.summary, 'Translation Comparison')}>
                            Explain <Mic className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-muted-foreground leading-relaxed italic">{transResult.summary}</p></CardContent>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                      {transResult.translations.map((t, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2 flex flex-row justify-between items-start">
                            <Badge variant="secondary" className="w-fit">{t.version}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveNote(`${t.version}: ${t.translation} (${t.notes})`, `Comparison: ${transResult.originalWord}`)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <CardTitle className="text-2xl mt-2 font-headline">{t.translation}</CardTitle>
                            <p className="text-sm font-medium text-primary mb-3 mt-2">Original: {t.originalWord} ({t.transliteration})</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{t.notes}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'verse-explorer' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center">
                  <h1 className="text-3xl font-bold font-headline">Verse Analytics</h1>
                  <p className="text-muted-foreground">Deep analysis powered by live scripture data.</p>
                </header>
                <Card className="max-w-2xl mx-auto shadow-md">
                  <CardContent className="pt-6">
                    <form onSubmit={handleVerseExploration} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={verseRefId}>Reference (e.g. John 3:16)</Label>
                        <Input 
                          id={verseRefId}
                          placeholder="Enter a Bible verse..." 
                          value={verseRef}
                          onChange={(e) => setVerseRef(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <Button className="w-full h-12 text-lg" type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2" />}
                        Run Deep Analysis
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {verseExploration && (
                  <Card className="border-l-4 border-l-primary shadow-xl overflow-hidden">
                    <CardHeader className="bg-muted/50 border-b flex flex-row justify-between items-center">
                      <CardTitle className="font-headline text-xl">Scholarly Overview: {verseRef}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSaveToBiblio(`Exegesis of ${verseRef}`, "Verse Study")}>
                          Cite <ClipboardList className="h-4 w-4 ml-2" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => askScholarAboutContext(verseExploration, `Analysis of ${verseRef}`)}>
                          Inquire <Mic className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-8">
                      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground text-lg">{verseExploration}</p>
                    </CardContent>
                  </Card>
                )}
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

            {activeTab === 'bibliography' && (
              <div className="space-y-6 animate-in fade-in">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Study Bibliography</h1>
                    <p className="text-muted-foreground">Academic citations for your research project.</p>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" /> Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => {
                          const text = biblioItems.map(b => `${b.citation} [${b.sourceType}] - Accessed: ${b.date}`).join('\n\n');
                          navigator.clipboard.writeText(text);
                          toast({ title: "Copied to Clipboard" });
                        }}>
                          <Copy className="h-4 w-4 mr-2" /> Copy Text
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToGoogleSheets("LexiVerse Study Bibliography", biblioItems)}>
                          <TableIcon className="h-4 w-4 mr-2" /> Export to Google Sheets
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToGoogleDocs("LexiVerse Bibliography", biblioItems.map(b => `- ${b.citation} (${b.sourceType})\n`).join(''))}>
                          <FileText className="h-4 w-4 mr-2" /> Export to Google Docs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setBiblioItems([]); localStorage.removeItem('lexiverse_biblio'); }}>
                      Reset
                    </Button>
                  </div>
                </header>

                {biblioItems.length === 0 ? (
                  <Card className="border-dashed py-20 text-center">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="text-muted-foreground">Bibliography is empty. Click "Cite" on any study result.</p>
                  </Card>
                ) : (
                  <Card className="shadow-lg">
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {biblioItems.map(item => (
                          <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors group flex justify-between items-center">
                            <div className="space-y-2">
                              <Badge variant="secondary" className="text-[9px] uppercase tracking-widest">{item.sourceType}</Badge>
                              <p className="font-medium text-lg font-headline leading-tight">{item.citation}</p>
                              <p className="text-[10px] text-muted-foreground italic">Captured: {item.date}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => {
                               const updated = biblioItems.filter(b => b.id !== item.id);
                               setBiblioItems(updated);
                               localStorage.setItem('lexiverse_biblio', JSON.stringify(updated));
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
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

            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in">
                <header>
                  <h1 className="text-3xl font-bold font-headline">Research Logs</h1>
                  <p className="text-muted-foreground">Session history and resources.</p>
                </header>
                <Card className="shadow-md">
                  <CardContent className="p-0">
                    {history.length === 0 ? (
                      <div className="p-20 text-center text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p>No activity yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {history.map(h => (
                          <div key={h.id} className="p-5 flex justify-between items-center hover:bg-muted/50 cursor-pointer transition-colors group" onClick={() => setActiveTab(h.type as any)}>
                            <div className="flex gap-4 items-center">
                              <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                <History className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div>
                                <div className="flex gap-2 items-center">
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{h.type}</Badge>
                                  <span className="font-semibold text-lg">{h.term}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{h.date}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
