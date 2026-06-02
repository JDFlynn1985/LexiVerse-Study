
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, where, getDoc } from 'firebase/firestore';
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
  LogOut,
  History,
  Library,
  Sparkles,
  Mic,
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
  GraduationCap,
  Highlighter,
  Link2
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { findCovertLinks, type CovertReferenceOutput } from '@/ai/flows/cross-reference-ai';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

type ViewMode = 'dashboard' | 'lexicon' | 'wiki' | 'theology-map' | 'timeline' | 'writing-assistant' | 'ai-settings' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library' | 'moderation';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  isModerator?: boolean;
  isTrustedContributor?: boolean;
  preferences?: {
    selectedModel: string;
    customApiKey: string;
    preferredBibleVersion: string;
    language?: string;
  };
}

interface WikiArticle {
  id: string;
  title: string;
  content: string;
  worksCited: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: string;
}

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights.length) return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
  const escaped = highlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
  const { language, t } = useLanguage();
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

  const [activeHighlights, setActiveHighlights] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Wiki State
  const [wikiDraft, setWikiDraft] = useState({ title: '', content: '', worksCited: '' });
  const wikiQuery = useMemo(() => query(collection(db, 'wiki_entries'), orderBy('createdAt', 'desc')), [db]);
  const { data: wikiArticles } = useCollection<WikiArticle>(wikiQuery);

  const moderationQuery = useMemo(() => query(collection(db, 'wiki_entries'), where('status', '==', 'pending')), [db]);
  const { data: pendingArticles } = useCollection<WikiArticle>(moderationQuery);

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
      const userRef = doc(db, 'users', result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { 
          uid: result.user.uid, 
          displayName: result.user.displayName, 
          email: result.user.email,
          isAdmin: false,
          isModerator: false,
          isTrustedContributor: false
        });
      }
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
      toast({ variant: 'destructive', title: 'Search failed' });
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
        toast({ title: "Insight Highlighted" });
      } else {
        setActiveHighlights(activeHighlights.filter(h => h !== text));
      }
    }
  };

  const submitWikiEntry = async () => {
    if (!user || !wikiDraft.title || !wikiDraft.content) return;
    setIsLoading(true);
    try {
      const status = userProfile?.isTrustedContributor ? 'approved' : 'pending';
      await addDoc(collection(db, 'wiki_entries'), {
        ...wikiDraft,
        status: status,
        authorUid: user.uid,
        authorName: user.displayName || 'Scholar',
        createdAt: new Date().toISOString()
      });
      setWikiDraft({ title: '', content: '', worksCited: '' });
      toast({ 
        title: status === 'approved' ? "Article Published" : "Submission Sent", 
        description: status === 'approved' ? "Your article is live on the wiki." : "Your article is awaiting scholarly peer review." 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: "Submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const moderateWiki = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'wiki_entries', id), { status });
      toast({ title: `Article ${status}` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Moderation action failed" });
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
      } catch (e) {
        toast({ variant: 'destructive', title: "Voice transcription failed" });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsRecording(true);
      toast({ title: "Listening..." });
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
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} tooltip="Dashboard">
                    <LayoutDashboard className="h-5 w-5" /> <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'wiki'} onClick={() => setActiveTab('wiki')} tooltip="Scholarly Wiki">
                    <GraduationCap className="h-5 w-5" /> <span>Scholarly Wiki</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userProfile?.isModerator && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} tooltip="Moderation Panel">
                      <ShieldAlert className="h-5 w-5 text-accent" /> <span>Peer Review</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>AI Research Hub</SidebarGroupLabel>
              <SidebarMenu>
                {[
                  { id: 'ai-assistant', label: 'Study Assistant', icon: Sparkles },
                  { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
                  { id: 'theology-map', label: 'Theology Map', icon: Network },
                  { id: 'timeline', label: 'Timeline', icon: Milestone },
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
              <SidebarGroupLabel>Repository</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'research-library'} onClick={() => setActiveTab('research-library')} tooltip="Local Library">
                    <Library className="h-5 w-5" /> <span>Local Library</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-1">
                {(userProfile?.isAdmin || !user) && (
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8"
                     onClick={() => window.open('/admin/settings', '_blank')}
                   >
                     <Settings className="h-4 w-4" />
                   </Button>
                )}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                        <Image src={user.photoURL || defaultAvatar?.imageUrl || ''} alt="User" width={40} height={40} className="object-cover" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" /> Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleLogin}>Login</Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
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
                  <header>
                    <h1 className="text-4xl font-bold font-headline">Research Workspace</h1>
                    <p className="text-muted-foreground text-lg">Integrated AI for advanced biblical scholarship.</p>
                  </header>

                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 shadow-md border-primary/10">
                      <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" /> Scholarly Workspace
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Greek/Hebrew term or eschatological question..." 
                            value={assistantTerm} 
                            onChange={e => setAssistantTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
                          />
                          <Button onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-primary/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-headline text-sm flex items-center gap-2">
                          <History className="h-4 w-4 text-primary" /> Search History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[150px]">
                          {history.map(h => (
                            <div key={h.id} className="p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer text-xs" onClick={() => handleSearch(h.term, h.type as any)}>
                              <p className="font-bold truncate">{h.term}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{h.type.replace('-', ' ')}</p>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'wiki' && (
                <div className="space-y-8">
                   <header className="flex justify-between items-center">
                     <div>
                       <h1 className="text-3xl font-bold font-headline">Scholarly Wiki</h1>
                       <p className="text-muted-foreground">Collaborative repository of verified theological insights.</p>
                     </div>
                     <Tabs defaultValue="browse" className="w-[400px]">
                       <TabsList className="grid w-full grid-cols-2">
                         <TabsTrigger value="browse">Browse Wiki</TabsTrigger>
                         <TabsTrigger value="submit">Submit Entry</TabsTrigger>
                       </TabsList>
                       <TabsContent value="browse" className="mt-6">
                         <div className="space-y-4">
                           {wikiArticles?.filter(a => a.status === 'approved').map(article => (
                             <Card key={article.id} className="shadow-sm">
                               <CardHeader>
                                 <CardTitle className="text-lg font-headline">{article.title}</CardTitle>
                                 <CardDescription>By {article.authorName} • {new Date(article.createdAt).toLocaleDateString()}</CardDescription>
                               </CardHeader>
                               <CardContent>
                                 <p className="text-sm line-clamp-3 mb-4">{article.content}</p>
                                 <Badge variant="outline">Verified Scholarly Content</Badge>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                       </TabsContent>
                       <TabsContent value="submit" className="mt-6">
                         <Card>
                           <CardHeader>
                             <CardTitle className="text-lg">New Wiki Contribution</CardTitle>
                             <CardDescription>
                               {userProfile?.isTrustedContributor 
                                 ? "As a Trusted Contributor, your post will go live immediately." 
                                 : "All submissions undergo peer review by moderators."}
                             </CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-4">
                             <div className="space-y-2">
                               <Label>Title</Label>
                               <Input value={wikiDraft.title} onChange={e => setWikiDraft({...wikiDraft, title: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                               <Label>Scholarly Synthesis</Label>
                               <Textarea rows={6} value={wikiDraft.content} onChange={e => setWikiDraft({...wikiDraft, content: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                               <Label>Works Cited (SBL/Turabian)</Label>
                               <Input value={wikiDraft.worksCited} onChange={e => setWikiDraft({...wikiDraft, worksCited: e.target.value})} />
                             </div>
                           </CardContent>
                           <CardFooter>
                             <Button className="w-full" onClick={submitWikiEntry} disabled={isLoading || !user}>
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                               {userProfile?.isTrustedContributor ? "Publish Article" : "Submit for Review"}
                             </Button>
                           </CardFooter>
                         </Card>
                       </TabsContent>
                     </Tabs>
                   </header>
                </div>
              )}

              {activeTab === 'moderation' && userProfile?.isModerator && (
                <div className="space-y-6">
                  <header>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-accent" /> Peer Review Moderation
                    </h1>
                    <p className="text-muted-foreground">Approve or reject scholarly contributions to the wiki.</p>
                  </header>

                  <div className="grid gap-6">
                    {pendingArticles?.map(article => (
                      <Card key={article.id} className="border-accent/20 bg-accent/5">
                        <CardHeader>
                          <CardTitle className="font-headline">{article.title}</CardTitle>
                          <CardDescription>Author: {article.authorName} ({article.authorUid})</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm leading-relaxed">{article.content}</p>
                          <div className="p-3 bg-background rounded border text-xs italic">
                            <strong>Citations:</strong> {article.worksCited}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => moderateWiki(article.id, 'approved')}>Approve</Button>
                          <Button variant="destructive" onClick={() => moderateWiki(article.id, 'rejected')}>Reject</Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {pendingArticles?.length === 0 && <p className="text-center py-12 text-muted-foreground italic">No articles currently awaiting peer review.</p>}
                  </div>
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
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                       <div className="space-y-4">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">AI Insights</h3>
                          <HighlightedText text={assistantResult.aiInsights} highlights={activeHighlights} />
                       </div>

                       <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b pb-1">Biblical References</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {assistantResult.verseUsages.map((v, i) => (
                            <div key={i} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between group">
                              <span className="text-xs font-medium">{v.text}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" asChild>
                                <a href={v.url} target="_blank" rel="noopener noreferrer"><Link2 className="h-3 w-3" /></a>
                              </Button>
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
                  <p className="text-muted-foreground font-headline animate-pulse">Consulting scholarly records...</p>
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
