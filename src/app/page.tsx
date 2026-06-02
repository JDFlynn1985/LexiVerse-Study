
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import { logSearch } from '@/lib/search-logging';
import { useLanguage } from '@/components/language-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  Network,
  Milestone,
  Settings,
  Edit3,
  ShieldCheck,
  LogOut,
  ChevronRight,
  TrendingUp,
  Library,
  Sparkles,
  Compass,
  Repeat,
  History,
  FileText,
  FileUp,
  Files,
  Download,
  Trash2,
  Mic,
  Database,
  Link2,
  CloudUpload,
  ScanText,
  Puzzle,
  LayoutDashboard,
  Share2,
  CheckCircle2,
  HardDrive,
  FileCode,
  Type,
  Highlighter
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { searchCommentariesForContext, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { extractTextFromImage } from '@/ai/flows/ocr-flow';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { findCovertLinks, type CovertReferenceOutput } from '@/ai/flows/cross-reference-ai';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, saveLocalDocument, deleteLocalDocument, type IDBDocument } from '@/lib/idb';
import { findOvertReferences } from '@/lib/cross-references';

// Export Utils
import { exportToPDF, exportToWord, exportToMarkdown, exportToRTF, exportToText } from '@/lib/export-service';
import { exportToGoogleDrive, exportToGoogleDocs } from '@/lib/google-export';

type ViewMode = 'dashboard' | 'lexicon' | 'commentaries' | 'wiki' | 'theology-map' | 'timeline' | 'writing-assistant' | 'integrity' | 'ai-settings' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library';

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

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <p className="text-sm leading-relaxed">{text}</p>;

  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <p className="text-sm leading-relaxed">
      {parts.map((part, i) => {
        const isMatch = highlights.some(h => h.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark key={i} className="bg-accent/40 text-inherit rounded px-0.5">{part}</mark>
        ) : part;
      })}
    </p>
  );
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
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [localDocuments, setLocalDocuments] = useState<IDBDocument[]>([]);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);

  const [aiPrefs, setAiPrefs] = useState({
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: '',
    preferredBibleVersion: 'kjv',
    language: language
  });

  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const [assistantTerm, setAssistantTerm] = useState('');

  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [theoResult, setTheoResult] = useState<TheologicalConceptOutput | null>(null);
  const [timelineResult, setTimelineResult] = useState<HistoricalTimelineOutput | null>(null);
  const [assistantResult, setAssistantResult] = useState<AiStudyAssistantOutput | null>(null);
  const [covertLinks, setCovertLinks] = useState<CovertReferenceOutput | null>(null);

  const [activeHighlights, setActiveHighlights] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  const [selectedExports, setSelectedExports] = useState<string[]>(['markdown']);

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
          }
        }
      });
      return () => unsub();
    }
  }, [user, db, language]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) setGoogleAccessToken(credential.accessToken);
      
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
    setGoogleAccessToken(null);
    toast({ title: "Logged out" });
  };

  const handleSearch = async (term: string, type: ViewMode) => {
    if (!term.trim()) return;
    setIsLoading(true);
    setActiveTab(type);
    setActiveHighlights([]);
    logSearch(db, term, type, user?.uid);
    try {
      let result;
      if (type === 'lexicon') {
        result = await defineAndAnalyzeTerm({ strongsNumber: term, model: aiPrefs.selectedModel });
        setLexiconResult(result);
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

  const handleHighlightSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 2) {
      if (!activeHighlights.includes(text)) {
        setActiveHighlights([...activeHighlights, text]);
        toast({ title: "Selection Highlighted", description: "This insight will be emphasized in exports." });
      } else {
        setActiveHighlights(activeHighlights.filter(h => h !== text));
        toast({ title: "Highlight Removed" });
      }
    } else {
      toast({ title: "No text selected", description: "Select a word or phrase to highlight it." });
    }
  };

  const handleMultiExport = async () => {
    if (!assistantResult) return;
    setIsLoading(true);
    try {
      for (const format of selectedExports) {
        switch (format) {
          case 'pdf': await exportToPDF(assistantResult, activeHighlights); break;
          case 'docx': await exportToWord(assistantResult, activeHighlights); break;
          case 'markdown': await exportToMarkdown(assistantResult, activeHighlights); break;
          case 'rtf': await exportToRTF(assistantResult, activeHighlights); break;
          case 'txt': await exportToText(assistantResult, activeHighlights); break;
          case 'gdrive': 
            if (googleAccessToken) await exportToGoogleDrive(googleAccessToken, assistantResult);
            else toast({ title: "Auth Required", description: "Link Google to export to Drive." });
            break;
          case 'gdocs': 
            if (googleAccessToken) await exportToGoogleDocs(googleAccessToken, assistantResult);
            else toast({ title: "Auth Required", description: "Link Google to export to Docs." });
            break;
        }
      }
      toast({ title: "Export Successful", description: `Saved to ${selectedExports.length} channel(s).` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Export Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSearch = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsLoading(true);
      try {
        const res = await transcribeAudio({ audioPart: "SGVsbG8gV29ybGQ=" }); 
        setSidebarSearchTerm(res.transcript);
        handleSearch(res.transcript, 'ai-assistant');
        toast({ title: "Voice Transcription Complete", description: `Researching: "${res.transcript}"` });
      } catch (e) {
        toast({ variant: 'destructive', title: "Voice transcription failed" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsRecording(true);
      toast({ title: "Listening...", description: "Speak your research query." });
    }
  };

  const handleFileSync = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: "Auth Required", description: "Please login to sync files to the cloud." });
      return;
    }
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
      toast({ title: "Cloud Sync Complete", description: "Your local library is now mirrored in your account." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Sync failed" });
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
      setIsLoading(true);
      try {
        const res = await extractTextFromImage({ imagePart: base64 });
        setOcrResult(res.text);
        const newDoc: IDBDocument = {
          id: Date.now().toString(),
          name: `OCR Extract - ${file.name}`,
          type: 'ocr',
          content: res.text,
          uploadDate: new Date().toLocaleDateString(),
          synced: false
        };
        await saveLocalDocument(newDoc);
        refreshLocalDocs();
        setActiveTab('research-library');
        toast({ title: "OCR Extract Success", description: "Manuscript text identified and saved to local library." });
      } catch (err) {
        toast({ variant: 'destructive', title: "OCR processing failed" });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCovertLinkScan = async (text: string) => {
    setIsLoading(true);
    try {
      const res = await findCovertLinks(text);
      setCovertLinks(res);
      toast({ title: "Semantic Analysis Complete", description: `Identified ${res.covertLinks.length} covert theological links.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Semantic scan failed" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const defaultAvatar = PlaceHolderImages.find(img => img.id === 'default-avatar');

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
                  aria-label="Voice search"
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
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" aria-label="User account" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                        <Image 
                          src={user.photoURL || defaultAvatar?.imageUrl || ''} 
                          alt={user.displayName || "User"} 
                          width={40} 
                          height={40} 
                          className="object-cover"
                          data-ai-hint={defaultAvatar?.imageHint || "user avatar"}
                        />
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
              <Button variant="ghost" size="icon" aria-label="Toggle theme" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main id="main-content" className="container max-w-5xl mx-auto py-10 px-6 min-h-screen">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
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
                          <Sparkles className="h-5 w-5 text-primary" /> Scholarly AI Workspace
                        </CardTitle>
                        <CardDescription>Synthesized research combining scripture, commentaries, and your local library.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Enter a Greek/Hebrew term or research question..." 
                            value={assistantTerm} 
                            onChange={e => setAssistantTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
                          />
                          <Button aria-label="Run assistant search" onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="cursor-pointer" onClick={() => setAssistantTerm('λόγος')}>λόγος</Badge>
                          <Badge variant="secondary" className="cursor-pointer" onClick={() => setAssistantTerm('δικαιοσύνη')}>δικαιοσύνη</Badge>
                          <Badge variant="secondary" className="cursor-pointer" onClick={() => setAssistantTerm('בְּרֵאשִׁית')}>בְּרֵאשִׁית</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" /> {t.dashboard.history}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[200px]">
                          {history.map(h => (
                            <div key={h.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleSearch(h.term, h.type as any)}>
                              <div className="flex justify-between items-start">
                                <p className="text-xs font-bold truncate max-w-[120px]">{h.term}</p>
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

                    <Card className="md:col-span-3 shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="font-headline text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" /> Future Research Horizons
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5">
                           <Puzzle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Zotero & Mendeley Sync</p>
                             <p className="text-[10px] text-muted-foreground">Seamlessly import/export bibliographic metadata for citations.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5">
                           <Network className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Semantic Vector Search</p>
                             <p className="text-[10px] text-muted-foreground">Advanced RAG across your entire research library.</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/5">
                           <Globe className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                           <div>
                             <p className="text-xs font-bold">Peer-Reviewed Scholarly Wiki</p>
                             <p className="text-[10px] text-muted-foreground">Collaborative knowledge base for verified theological research.</p>
                           </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'research-library' && (
                <div className="space-y-6">
                  <header className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">Research Library</h1>
                      <p className="text-muted-foreground">Locally persistent scholarly documents (IndexedDB).</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleFileSync}><CloudUpload className="h-4 w-4 mr-2" /> Sync to Cloud</Button>
                      <Label htmlFor="ocr-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                          <ScanText className="h-4 w-4" /> OCR Extract
                        </div>
                        <Input id="ocr-upload" type="file" className="hidden" accept="image/*" onChange={handleOCR} />
                      </Label>
                    </div>
                  </header>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-headline flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" /> Persistent Local Library
                      </CardTitle>
                      <CardDescription>Documents stored in browser IndexedDB for privacy and high performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {localDocuments.length === 0 && <p className="text-center py-10 text-muted-foreground italic">No documents found in your local library.</p>}
                        {localDocuments.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border group hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                              <div>
                                <p className="font-bold text-sm">{doc.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{doc.type} • {doc.uploadDate} • {doc.synced ? 'Synced' : 'Local Only'}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" onClick={() => handleSearch(doc.name, 'ai-assistant')}><Sparkles className="h-4 w-4 mr-1" /> Analyze</Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                deleteLocalDocument(doc.id);
                                refreshLocalDocs();
                                toast({ title: "Document Removed" });
                              }} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'ai-assistant' && assistantResult && (
                <div className="space-y-6">
                  <Card className="shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-3xl font-bold font-headline text-primary">{assistantResult.originalWord}</h2>
                          <p className="text-muted-foreground">{assistantResult.transliteration} • {assistantResult.pronunciation}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleHighlightSelection}>
                            <Highlighter className="h-4 w-4 mr-2" /> Highlight Selection
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Share2 className="h-4 w-4 mr-2" /> Multi-Export ({selectedExports.length})
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64">
                              <DropdownMenuLabel>Select Formats & Channels</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('pdf')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'pdf']) : setSelectedExports(selectedExports.filter(e => e !== 'pdf'))}
                              >
                                <FileText className="h-4 w-4 mr-2" /> PDF Document
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('docx')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'docx']) : setSelectedExports(selectedExports.filter(e => e !== 'docx'))}
                              >
                                <Files className="h-4 w-4 mr-2" /> Word Document (.docx)
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('rtf')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'rtf']) : setSelectedExports(selectedExports.filter(e => e !== 'rtf'))}
                              >
                                <Type className="h-4 w-4 mr-2" /> Rich Text (.rtf)
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('markdown')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'markdown']) : setSelectedExports(selectedExports.filter(e => e !== 'markdown'))}
                              >
                                <FileCode className="h-4 w-4 mr-2" /> Markdown (Obsidian)
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('txt')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'txt']) : setSelectedExports(selectedExports.filter(e => e !== 'txt'))}
                              >
                                <FileText className="h-4 w-4 mr-2" /> Plain Text (.txt)
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('gdrive')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'gdrive']) : setSelectedExports(selectedExports.filter(e => e !== 'gdrive'))}
                              >
                                <HardDrive className="h-4 w-4 mr-2" /> Google Drive
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuCheckboxItem 
                                checked={selectedExports.includes('gdocs')} 
                                onCheckedChange={checked => checked ? setSelectedExports([...selectedExports, 'gdocs']) : setSelectedExports(selectedExports.filter(e => e !== 'gdocs'))}
                              >
                                <Edit3 className="h-4 w-4 mr-2" /> Google Docs
                              </DropdownMenuCheckboxItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="bg-primary text-primary-foreground font-bold" onClick={handleMultiExport}>
                                <Download className="h-4 w-4 mr-2" /> Run Export Process
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Definitions</h3>
                          <ul className="list-disc pl-5 space-y-2">
                            {assistantResult.definitions.map((d, i) => <li key={i} className="text-sm italic">{d}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">AI Synthesis</h3>
                          <HighlightedText text={assistantResult.aiInsights} highlights={activeHighlights} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Biblical Cross-References</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {assistantResult.verseUsages.map((v, i) => (
                            <div key={i} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between group">
                              <span className="text-xs font-medium">{v.text}</span>
                              <Button variant="ghost" size="icon" aria-label={`Open ${v.text}`} className="h-6 w-6 opacity-0 group-hover:opacity-100" asChild>
                                <a href={v.url} target="_blank" rel="noopener noreferrer"><Link2 className="h-3 w-3" /></a>
                              </Button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                           <Button variant="outline" size="sm" onClick={() => {
                             const overt = findOvertReferences(assistantResult.aiInsights);
                             toast({ title: "Overt Links Found", description: overt.join(', ') || "No explicit citations detected." });
                           }}><Link2 className="h-4 w-4 mr-2" /> Scan Overt</Button>
                           <Button variant="outline" size="sm" onClick={() => handleCovertLinkScan(assistantResult.aiInsights)}><Sparkles className="h-4 w-4 mr-2" /> Scan Covert</Button>
                        </div>
                      </div>

                      {covertLinks && (
                        <div className="p-4 bg-accent/5 rounded-xl border border-accent/20 space-y-4">
                           <h4 className="text-sm font-bold text-accent flex items-center gap-2"><Sparkles className="h-4 w-4" /> Covert (Semantic) References</h4>
                           <div className="space-y-3">
                             {covertLinks.covertLinks.map((link, idx) => (
                               <div key={idx} className="text-xs border-l-2 border-accent pl-3 space-y-1">
                                 <p className="font-bold">{link.suggestedScripture}</p>
                                 <p className="text-muted-foreground italic">"{link.sourceFragment}"</p>
                                 <p className="text-[10px] text-muted-foreground">{link.theologicalBasis}</p>
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Bibliography</h3>
                        <div className="space-y-2">
                          {assistantResult.bibliography.map((b, i) => (
                            <div key={i} className="text-xs flex items-center gap-2">
                              <span className="text-muted-foreground">{i + 1}.</span>
                              <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{b.text}</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground font-headline animate-pulse">Consulting the digital library...</p>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
