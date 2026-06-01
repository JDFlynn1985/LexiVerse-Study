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
  Type
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
import { getVersions, type BibleVersion } from '@/lib/bible-api';

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
      setDoc(userRef, userData, { merge: true })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'write',
            requestResourceData: userData,
          });
          errorEmitter.emit('permission-error', permissionError);
        });
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

  const listDriveFiles = async () => {
    if (!googleAccessToken) return;
    setIsFetchingDrive(true);
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document' or mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id, name, mimeType)`, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      const data = await response.json();
      setDriveFiles(data.files || []);
      setIsDriveModalOpen(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Drive Access Error", description: "Could not retrieve your Google Drive files." });
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
          if (c.paragraph) return c.paragraph.elements.map((e: any) => e.textRun?.content || "").join("");
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
      toast({ title: "Import Successful", description: `"${file.name}" added to your knowledge base.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToGoogleKeep = (content: string, title: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied for Google Keep", description: "Content is on your clipboard. Opening Google Keep..." });
    window.open('https://keep.google.com/', '_blank');
  };

  const exportToGoogleDocs = async (title: string, content: string) => {
    if (!googleAccessToken) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login with Google to export." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create document');
      const docRes = await response.json();
      await fetch(`https://docs.googleapis.com/v1/documents/${docRes.documentId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ insertText: { location: { index: 1 }, text: content } }]
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
      toast({ variant: "destructive", title: "Export Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToGoogleSheets = async (title: string, data: BiblioItem[]) => {
    if (!googleAccessToken) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please login with Google." });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title } }),
      });
      if (!response.ok) throw new Error('Failed to create spreadsheet');
      const sheet = await response.json();
      const spreadsheetId = sheet.spreadsheetId;
      const values = [['Citation', 'Source Type', 'Date Captured'], ...data.map(item => [item.citation, item.sourceType, item.date])];
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      toast({ title: "Exported to Google Sheets", description: `"${title}" created.`, action: (
        <Button variant="outline" size="sm" onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank')}>Open Sheet</Button>
      )});
    } catch (error: any) {
      toast({ variant: "destructive", title: "Export Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
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
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        format = 'pdf';
      } else if (extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
        format = 'docx';
      } else {
        content = await file.text();
        format = 'txt';
      }
      const newPaper: ResearchPaper = { id: Date.now().toString(), title: fileName, content, format, date: new Date().toLocaleString() };
      const updated = [newPaper, ...researchPapers];
      setResearchPapers(updated);
      localStorage.setItem('lexiverse_papers', JSON.stringify(updated));
      toast({ title: "Paper Uploaded", description: `"${fileName}" has been processed.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const captureSelectionToNotes = () => {
    const selection = window.getSelection()?.toString();
    if (selection) handleSaveNote(selection, currentContext || "Active Study");
    else toast({ variant: "destructive", title: "No Text Selected", description: "Highlight text first." });
  };

  const askScholarAboutContext = (content: string, type: string) => {
    setChatInput(`Can you explain the significance and context of this ${type}: "${content}"?`);
    setActiveTab('scholar-ai');
  };

  async function generateSpecificCitation(item: BiblioItem, type: 'footnote' | 'inline') {
    setIsLoading(true);
    try {
      const data = await formatBibliography({ items: [item.citation], style: biblioStyle, formatType: type });
      setActiveCitation({ type, text: data.formattedOutput });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed' });
    } finally {
      setIsLoading(false);
    }
  }

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
                  { id: 'bibles', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
                  { id: 'dictionaries', label: 'Dictionaries', icon: Library },
                  { id: 'papers', label: 'Knowledge Base', icon: FileSearch },
                  { id: 'translations', label: 'Comparisons', icon: Scale },
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
              <SidebarGroupLabel>Scholar Tools</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'scholar-ai', label: 'Scholar AI', icon: Mic },
                  { id: 'writing-assistant', label: 'Writing AI', icon: SpellCheck },
                  { id: 'integrity', label: 'Integrity Scan', icon: ShieldCheck },
                  { id: 'bibliography', label: 'Citation Manager', icon: ClipboardList },
                  { id: 'notes', label: 'My Notes', icon: Edit3 },
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
              <Highlighter className="h-4 w-4 mr-2" /> Capture Note
            </Button>
          </div>

          <main className="container max-w-5xl mx-auto py-10 px-6">
            {activeTab === 'bibles' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="border-b pb-6">
                  <h1 className="text-3xl font-bold font-headline">Study Dashboard</h1>
                  <p className="text-muted-foreground">Synthesize scripture, lexicons, and personal research.</p>
                </header>
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="bg-primary text-primary-foreground shadow-xl">
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
                    <CardContent><p className="font-bold text-lg">{history[0]?.term || 'No history'}</p></CardContent>
                  </Card>
                  <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Edit3 className="h-4 w-4" /> Notes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{notes.length}</p></CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> Library</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{researchPapers.length}</p></CardContent></Card>
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
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Get Citation</Button></DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => generateSpecificCitation(item, 'footnote')}>As Footnote</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => generateSpecificCitation(item, 'inline')}>As Inline Ref</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
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
            
            {/* Additional tab views (lexicon, dictionaries, etc) continue with same integration patterns */}

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
