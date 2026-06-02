
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
  Link2,
  Newspaper,
  PenTool,
  CheckCircle2,
  Clock,
  BookMarked,
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  Tags,
  Filter,
  X
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// AI Flow Imports
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { getVersions, type BibleVersion } from '@/lib/bible-api';
import { getAllLocalDocuments, type IDBDocument } from '@/lib/idb';

type ViewMode = 'dashboard' | 'lexicon' | 'wiki' | 'blog' | 'theology-map' | 'timeline' | 'writing-assistant' | 'academic-integrity' | 'ai-settings' | 'ai-assistant' | 'verse-explorer' | 'compare-translations' | 'research-library' | 'moderation';

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

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: string;
  tags?: string[];
}

const BLOG_CATEGORIES = ["Linguistics", "Theology", "History", "Archaeology", "Hermeneutics", "General"];

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

  // Blog State
  const [blogDraft, setBlogDraft] = useState({ title: '', excerpt: '', content: '', category: 'General', tagInput: '' });
  const [blogFilter, setBlogFilter] = useState({ category: 'All', tag: '' });

  const blogQuery = useMemo(() => {
    let q = query(collection(db, 'blog_posts'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
    return q;
  }, [db]);

  const { data: rawBlogPosts } = useCollection<BlogPost>(blogQuery);

  const filteredBlogPosts = useMemo(() => {
    return rawBlogPosts.filter(post => {
      const categoryMatch = blogFilter.category === 'All' || post.category === blogFilter.category;
      const tagMatch = !blogFilter.tag || post.tags?.some(tag => tag.toLowerCase().includes(blogFilter.tag.toLowerCase()));
      return categoryMatch && tagMatch;
    });
  }, [rawBlogPosts, blogFilter]);

  const allAvailableTags = useMemo(() => {
    const tags = new Set<string>();
    rawBlogPosts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [rawBlogPosts]);

  // Moderation State
  const pendingWikiQuery = useMemo(() => query(collection(db, 'wiki_entries'), where('status', '==', 'pending')), [db]);
  const { data: pendingArticles } = useCollection<WikiArticle>(pendingWikiQuery);
  const pendingBlogQuery = useMemo(() => query(collection(db, 'blog_posts'), where('status', '==', 'pending')), [db]);
  const { data: pendingBlogPosts } = useCollection<BlogPost>(pendingBlogQuery);

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

  const submitBlogPost = async () => {
    if (!user || !blogDraft.title || !blogDraft.content) return;
    setIsLoading(true);
    try {
      const status = userProfile?.isAdmin || userProfile?.isTrustedContributor ? 'approved' : 'pending';
      const tags = blogDraft.tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      
      await addDoc(collection(db, 'blog_posts'), {
        title: blogDraft.title,
        content: blogDraft.content,
        excerpt: blogDraft.excerpt,
        category: blogDraft.category,
        tags: tags,
        status: status,
        authorUid: user.uid,
        authorName: user.displayName || 'Scholar',
        createdAt: new Date().toISOString()
      });
      
      setBlogDraft({ title: '', excerpt: '', content: '', category: 'General', tagInput: '' });
      toast({ 
        title: status === 'approved' ? "Post Published" : "Post Submitted", 
        description: status === 'approved' ? "Your post is now live in the journal." : "Your post is awaiting review." 
      });
    } catch (e) {
      toast({ variant: 'destructive', title: "Blog submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const moderateContent = async (id: string, collectionName: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, collectionName, id), { status });
      toast({ title: `Content ${status}` });
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
          </SidebarHeader>
          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>General</SidebarGroupLabel>
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
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'blog'} onClick={() => setActiveTab('blog')} tooltip="Scholar's Journal">
                    <Newspaper className="h-5 w-5" /> <span>Scholar's Journal</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* AI Research Hub */}
            <SidebarGroup>
              <SidebarGroupLabel>AI Research Hub</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'ai-assistant'} onClick={() => setActiveTab('ai-assistant')} tooltip="Study Assistant">
                    <Sparkles className="h-5 w-5" /> <span>Study Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'lexicon'} onClick={() => setActiveTab('lexicon')} tooltip="Lexicon Analysis">
                    <BookOpen className="h-5 w-5" /> <span>Lexicon</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'theology-map'} onClick={() => setActiveTab('theology-map')} tooltip="Theology Concept Map">
                    <Network className="h-5 w-5" /> <span>Theology Map</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} tooltip="Historical Timeline">
                    <Milestone className="h-5 w-5" /> <span>Historical Timeline</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Linguistic Tools */}
            <SidebarGroup>
              <SidebarGroupLabel>Linguistic Analysis</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'verse-explorer'} onClick={() => setActiveTab('verse-explorer')} tooltip="Verse Explorer">
                    <BookMarked className="h-5 w-5" /> <span>Verse Explorer</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'compare-translations'} onClick={() => setActiveTab('compare-translations')} tooltip="Translation Comparison">
                    <ArrowLeftRight className="h-5 w-5" /> <span>Compare Versions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Scholarly Synthesis */}
            <SidebarGroup>
              <SidebarGroupLabel>Synthesis & Library</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'research-library'} onClick={() => setActiveTab('research-library')} tooltip="Research Library">
                    <Library className="h-5 w-5" /> <span>Research Library</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'writing-assistant'} onClick={() => setActiveTab('writing-assistant')} tooltip="Writing Assistant">
                    <PenTool className="h-5 w-5" /> <span>Writing Assistant</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={activeTab === 'academic-integrity'} onClick={() => setActiveTab('academic-integrity')} tooltip="Integrity Checker">
                    <ShieldCheck className="h-5 w-5" /> <span>Academic Integrity</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Moderation */}
            {userProfile?.isModerator && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={activeTab === 'moderation'} onClick={() => setActiveTab('moderation')} tooltip="Peer Review">
                      <ShieldAlert className="h-5 w-5 text-accent" /> <span>Peer Review</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
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
                          <History className="h-4 w-4 text-primary" /> Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[200px]">
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
                   </header>
                   <Tabs defaultValue="browse" className="w-full">
                     <TabsList>
                       <TabsTrigger value="browse">Browse Articles</TabsTrigger>
                       <TabsTrigger value="submit">Submit Entry</TabsTrigger>
                     </TabsList>
                     <TabsContent value="browse" className="pt-6 grid gap-4 md:grid-cols-2">
                        {wikiArticles?.filter(a => a.status === 'approved').map(article => (
                          <Card key={article.id} className="shadow-sm">
                            <CardHeader>
                              <CardTitle className="text-lg font-headline">{article.title}</CardTitle>
                              <CardDescription>By {article.authorName} • {new Date(article.createdAt).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm line-clamp-3 mb-4">{article.content}</p>
                              <Badge variant="outline">Peer Reviewed</Badge>
                            </CardContent>
                          </Card>
                        ))}
                     </TabsContent>
                     <TabsContent value="submit" className="pt-6">
                        <Card className="max-w-2xl mx-auto">
                          <CardHeader>
                            <CardTitle>Contribute to Wiki</CardTitle>
                            <CardDescription>Share linguistic or theological findings with citations.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input value={wikiDraft.title} onChange={e => setWikiDraft({...wikiDraft, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Content</Label>
                              <Textarea rows={6} value={wikiDraft.content} onChange={e => setWikiDraft({...wikiDraft, content: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Citations (SBL Style)</Label>
                              <Input value={wikiDraft.worksCited} onChange={e => setWikiDraft({...wikiDraft, worksCited: e.target.value})} />
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" onClick={submitWikiEntry} disabled={isLoading || !user}>
                              {userProfile?.isTrustedContributor ? "Publish Now" : "Submit for Peer Review"}
                            </Button>
                          </CardFooter>
                        </Card>
                     </TabsContent>
                   </Tabs>
                </div>
              )}

              {activeTab === 'blog' && (
                <div className="space-y-8">
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">Scholar's Journal</h1>
                      <p className="text-muted-foreground">Academic blog for theological reflections and scholarly news.</p>
                    </div>
                  </header>
                  <Tabs defaultValue="read" className="w-full">
                    <TabsList>
                      <TabsTrigger value="read">Read Journal</TabsTrigger>
                      <TabsTrigger value="write">New Entry</TabsTrigger>
                    </TabsList>
                    <TabsContent value="read" className="pt-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Blog Sidebar Filter */}
                        <aside className="w-full md:w-64 space-y-6">
                          <Card className="p-4 shadow-sm border-primary/5">
                            <CardHeader className="p-0 pb-3">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Filter className="h-4 w-4" /> Filter by Taxonomy
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Category</Label>
                                <Select value={blogFilter.category} onValueChange={(val) => setBlogFilter({...blogFilter, category: val})}>
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="All Categories" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="All">All Categories</SelectItem>
                                    {BLOG_CATEGORIES.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Search Tags</Label>
                                <div className="relative">
                                  <Input 
                                    placeholder="Type tag..." 
                                    className="h-8 text-xs pr-8"
                                    value={blogFilter.tag}
                                    onChange={(e) => setBlogFilter({...blogFilter, tag: e.target.value})}
                                  />
                                  {blogFilter.tag && (
                                    <button 
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      onClick={() => setBlogFilter({...blogFilter, tag: ''})}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {allAvailableTags.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-xs">Common Tags</Label>
                                  <div className="flex flex-wrap gap-1">
                                    {allAvailableTags.slice(0, 8).map(tag => (
                                      <Badge 
                                        key={tag} 
                                        variant={blogFilter.tag === tag ? "default" : "outline"}
                                        className="text-[10px] cursor-pointer"
                                        onClick={() => setBlogFilter({...blogFilter, tag: tag === blogFilter.tag ? '' : tag})}
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </aside>

                        {/* Blog Feed */}
                        <div className="flex-1 space-y-6">
                          {filteredBlogPosts?.map(post => (
                            <Card key={post.id} className="shadow-md border-primary/5 bg-card/50">
                              <CardHeader>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{post.category}</Badge>
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {new Date(post.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <CardTitle className="text-2xl font-headline mb-1">{post.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                      <PenTool className="h-3 w-3" /> {post.authorName}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                              </CardContent>
                              <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                                <Tags className="h-3 w-3 text-muted-foreground mr-1" />
                                {post.tags?.map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="outline" 
                                    className="text-[10px] cursor-pointer hover:bg-muted"
                                    onClick={() => setBlogFilter({...blogFilter, tag})}
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                                {(!post.tags || post.tags.length === 0) && <span className="text-[10px] text-muted-foreground italic">No tags</span>}
                              </CardFooter>
                            </Card>
                          ))}
                          {filteredBlogPosts?.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground italic bg-muted/20 rounded-xl border border-dashed">
                              No journal entries matching your criteria.
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="write" className="pt-6">
                      <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                          <CardTitle>Draft Journal Post</CardTitle>
                          <CardDescription>Share your research journey or theological reflections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Headline</Label>
                              <Input placeholder="e.g., The Eschatological Implications of 'Logos'" value={blogDraft.title} onChange={e => setBlogDraft({...blogDraft, title: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={blogDraft.category} onValueChange={(val) => setBlogDraft({...blogDraft, category: val})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {BLOG_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Tags (comma separated)</Label>
                            <Input placeholder="greek, exegesis, pauline" value={blogDraft.tagInput} onChange={e => setBlogDraft({...blogDraft, tagInput: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Academic Reflection</Label>
                            <Textarea rows={10} placeholder="Type your scholarly content here..." value={blogDraft.content} onChange={e => setBlogDraft({...blogDraft, content: e.target.value})} />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" onClick={submitBlogPost} disabled={isLoading || !user}>
                            {userProfile?.isAdmin || userProfile?.isTrustedContributor ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish to Journal</> : <><Clock className="mr-2 h-4 w-4" /> Submit for Review</>}
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeTab === 'moderation' && userProfile?.isModerator && (
                <div className="space-y-6">
                  <header>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-accent" /> Scholarly Peer Review
                    </h1>
                    <p className="text-muted-foreground">Manage pending contributions across the wiki and journal.</p>
                  </header>

                  <div className="grid gap-8">
                    <section className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Pending Wiki Articles</h2>
                      {pendingArticles?.map(article => (
                        <Card key={article.id} className="border-accent/20 bg-accent/5">
                          <CardHeader>
                            <CardTitle className="font-headline">{article.title}</CardTitle>
                            <CardDescription>Author: {article.authorName}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-2">{article.content}</p>
                            <p className="text-xs italic text-muted-foreground">Citations: {article.worksCited}</p>
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Button size="sm" onClick={() => moderateContent(article.id, 'wiki_entries', 'approved')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => moderateContent(article.id, 'wiki_entries', 'rejected')}>Reject</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </section>

                    <section className="space-y-4">
                      <h2 className="text-lg font-bold flex items-center gap-2"><Newspaper className="h-5 w-5" /> Pending Blog Posts</h2>
                      {pendingBlogPosts?.map(post => (
                        <Card key={post.id} className="border-accent/20 bg-accent/5">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge variant="outline" className="mb-2">{post.category}</Badge>
                                <CardTitle className="font-headline">{post.title}</CardTitle>
                                <CardDescription>Author: {post.authorName}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-4">{post.content}</p>
                            <div className="flex flex-wrap gap-1">
                              {post.tags?.map(tag => <Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>)}
                            </div>
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Button size="sm" onClick={() => moderateContent(post.id, 'blog_posts', 'approved')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => moderateContent(post.id, 'blog_posts', 'rejected')}>Reject</Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </section>
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
