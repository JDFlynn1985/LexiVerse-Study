'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { appConfig } from '@/app-config';
import { useAuth, useFirestore, useUser, useCollection } from '@/firebase';
import { logSearch } from '@/lib/search-logging';

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
  Loader2,
  MessageSquare,
  Send,
  Sun,
  Moon,
  ExternalLink,
  Globe,
  Megaphone,
  Network,
  Milestone,
  Settings,
  LifeBuoy,
  HelpCircle,
  ShieldQuestion,
  Plus,
  Type,
  LayoutDashboard,
  ShieldCheck,
  Edit3,
  LogOut,
  ChevronRight
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { searchCommentariesForContext, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';
import { trackAdClick } from '@/components/analytics';
import { analyzeTheologicalConcept, type TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { generateHistoricalTimeline, type HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';

type ViewMode = 'dashboard' | 'lexicon' | 'dictionaries' | 'commentaries' | 'wiki' | 'theology-map' | 'timeline' | 'writing-assistant' | 'integrity' | 'ai-settings' | 'support';

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  worksCited: string;
  bibliography: string;
  status: 'pending' | 'approved' | 'rejected';
  authorUid: string;
  authorName: string;
  createdAt: string;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
}

export default function Home() {
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
  const [aiPrefs, setAiPrefs] = useState({
    selectedModel: 'googleai/gemini-2.5-flash',
    customApiKey: ''
  });

  // Search States
  const [strongsTerm, setStrongsTerm] = useState('');
  const [lexiconResult, setLexiconResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [dictTerm, setDictTerm] = useState('');
  const [dictResult, setDictResult] = useState<DefineAndAnalyzeTermOutput | null>(null);
  const [commWord, setCommWord] = useState('');
  const [commLanguage, setCommLanguage] = useState('Greek');
  const [commResult, setCommResult] = useState<SearchCommentariesOutput | null>(null);
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

  // Support States
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    appConfig.google.scopes.forEach(scope => provider.addScope(scope));
    try {
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      setDoc(userRef, { 
        uid: result.user.uid, 
        displayName: result.user.displayName, 
        email: result.user.email 
      }, { merge: true });
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

  const handleSearch = async (term: string, type: 'lexicon' | 'dictionary' | 'commentary' | 'theology' | 'timeline') => {
    if (!term.trim()) return;
    setIsLoading(true);
    logSearch(db, term, type, user?.uid);
    try {
      let result;
      if (type === 'lexicon' || type === 'dictionary') {
        result = await defineAndAnalyzeTerm({ strongsNumber: term, model: aiPrefs.selectedModel });
        if (type === 'lexicon') setLexiconResult(result);
        else setDictResult(result);
      } else if (type === 'commentary') {
        result = await searchCommentariesForContext({ word: term, language: commLanguage, model: aiPrefs.selectedModel });
        setCommResult(result);
      } else if (type === 'theology') {
        result = await analyzeTheologicalConcept({ concept: term });
        setTheoResult(result);
      } else if (type === 'timeline') {
        result = await generateHistoricalTimeline({ topic: term });
        setTimelineResult(result);
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

  const handleCreateWikiEntry = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Login Required' }); return; }
    if (!newWikiTitle.trim() || !newWikiContent.trim() || !newWikiWorksCited.trim() || !newWikiBiblio.trim()) {
      toast({ variant: 'destructive', title: 'Incomplete Fields', description: 'Academic contributions require full citations and bibliographies.' });
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
      toast({ title: 'Submitted', description: 'Your entry is pending moderator review.' });
      setNewWikiTitle(''); setNewWikiContent(''); setNewWikiWorksCited(''); setNewWikiBiblio('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Submission failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWikiStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!userProfile?.isAdmin) return;
    updateDoc(doc(db, 'wiki_entries', id), { status });
    toast({ title: `Entry ${status}` });
  };

  const handleCreateTicket = () => {
    if (!ticketSubject || !ticketDescription) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    setIsLoading(true);
    // Simulate osTicket integration
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Ticket Created", description: `Case #${Math.floor(Math.random() * 90000) + 10000} has been logged in osTicket.` });
      setTicketSubject('');
      setTicketDescription('');
    }, 1500);
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
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
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
                  { id: 'lexicon', label: 'Lexicon', icon: BookOpen },
                  { id: 'dictionaries', label: 'Dictionaries', icon: Type },
                  { id: 'commentaries', label: 'Commentaries', icon: Scroll },
                  { id: 'wiki', label: 'Scholarly Wiki', icon: Globe },
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
                  { id: 'theology-map', label: 'Theology Map', icon: Network },
                  { id: 'timeline', label: 'Historical Timeline', icon: Milestone },
                  { id: 'writing-assistant', label: 'Writing Editor', icon: Edit3 },
                  { id: 'integrity', label: 'Academic Integrity', icon: ShieldCheck },
                ].map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id as ViewMode)} tooltip={item.label}>
                      <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-4 border-t pt-4">
              <SidebarGroupLabel>Scholar Support</SidebarGroupLabel>
              <div className="px-2 py-1">
                <div className="bg-muted/30 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer group" onClick={() => trackAdClick('scholar_support_side', 'sidebar')}>
                   <Megaphone className="h-4 w-4 mx-auto mb-1 opacity-40 group-hover:text-primary" />
                   <p className="text-[10px] text-muted-foreground italic">Support academic research</p>
                </div>
              </div>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t flex flex-row items-center justify-between">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-8 w-8 rounded-full overflow-hidden border">
                    <img src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setActiveTab('ai-settings')}><Settings className="h-4 w-4 mr-2" /> AI Configuration</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab('support')}><LifeBuoy className="h-4 w-4 mr-2" /> Help Center</DropdownMenuItem>
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
          <main className="container max-w-5xl mx-auto py-10 px-6 min-h-screen flex flex-col">
            <div className="flex-1" id="main-content">
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in">
                  <header>
                    <h1 className="text-4xl font-bold font-headline">Research Workspace</h1>
                    <p className="text-muted-foreground text-lg">Integrated AI tools for biblical scholarship.</p>
                  </header>

                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2">
                      <CardHeader><CardTitle className="font-headline">Quick Start</CardTitle></CardHeader>
                      <CardContent className="grid gap-4">
                        <Button variant="outline" className="justify-start gap-3 h-14" onClick={() => setActiveTab('lexicon')}>
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold">Original Language Lexicon</p>
                            <p className="text-xs text-muted-foreground">Trace Greek and Hebrew roots via Strong's.</p>
                          </div>
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-14" onClick={() => setActiveTab('commentaries')}>
                          <Scroll className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <p className="font-bold">Commentary Search</p>
                            <p className="text-xs text-muted-foreground">Extract historical context from scholarly works.</p>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="font-headline text-sm">Recent Activity</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[250px]">
                          {history.map(h => (
                            <div key={h.id} className="p-3 border-b hover:bg-muted/50 transition-colors">
                              <p className="text-xs font-bold font-headline">{h.term}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{h.type}</p>
                            </div>
                          ))}
                          {history.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground italic">No recent history.</p>}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'lexicon' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Original Language Lexicon</h1>
                    <p className="text-muted-foreground">Deep analysis of Greek and Hebrew terms via Strong's numbers.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter Strong's Number (e.g., G3056, H7225)..." 
                          value={strongsTerm} 
                          onChange={e => setStrongsTerm(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(strongsTerm, 'lexicon')}
                        />
                        <Button onClick={() => handleSearch(strongsTerm, 'lexicon')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {lexiconResult && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <div>
                          <Badge variant="outline" className="mb-2">{lexiconResult.searchStrongNumber}</Badge>
                          <CardTitle className="text-3xl font-headline text-primary">{lexiconResult.originalWord}</CardTitle>
                          <CardDescription>{lexiconResult.transliteration} • {lexiconResult.pronunciation}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Definitions</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                              {lexiconResult.definitions.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Lexical Data</h4>
                            <p className="text-sm leading-relaxed">{lexiconResult.lexicalData}</p>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-bold text-sm uppercase tracking-wider mb-2">Academic Summary</h4>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{lexiconResult.summary}</p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-bold text-xs uppercase tracking-wider mb-2">Bibliography (SBL Style)</h4>
                          <p className="text-[10px] italic">{lexiconResult.bibliography}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'dictionaries' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Biblical Dictionaries</h1>
                    <p className="text-muted-foreground">Theological and encyclopedia definitions for biblical concepts.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Search concepts (e.g., Justification, Covenant)..." 
                          value={dictTerm} 
                          onChange={e => setDictTerm(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(dictTerm, 'dictionary')}
                        />
                        <Button onClick={() => handleSearch(dictTerm, 'dictionary')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {dictResult && (
                    <Card>
                      <CardHeader><CardTitle className="font-headline text-2xl">{dictResult.originalWord}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm leading-relaxed">{dictResult.summary}</p>
                        <Separator />
                        <h4 className="text-xs font-bold uppercase text-muted-foreground">Academic Source</h4>
                        <p className="text-[10px] italic">{dictResult.bibliography}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'commentaries' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Scholarly Commentaries</h1>
                    <p className="text-muted-foreground">Historical and linguistic context from academic commentaries.</p>
                  </header>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <Input 
                        placeholder="Search word or phrase..." 
                        value={commWord} 
                        onChange={e => setCommWord(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSearch(commWord, 'commentary')}
                      />
                    </div>
                    <Select value={commLanguage} onValueChange={setCommLanguage}>
                      <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Greek">Greek</SelectItem>
                        <SelectItem value="Hebrew">Hebrew</SelectItem>
                        <SelectItem value="Latin">Latin</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => handleSearch(commWord, 'commentary')} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Analyze Context
                  </Button>

                  {commResult && (
                    <div className="space-y-6">
                      <Card className="bg-muted/10">
                        <CardHeader><CardTitle className="font-headline text-xl">Historical Synthesis</CardTitle></CardHeader>
                        <CardContent><p className="text-sm leading-relaxed">{commResult.commentarySummary}</p></CardContent>
                      </Card>
                      <div className="grid md:grid-cols-2 gap-4">
                        {commResult.specificInsights.map((insight, i) => (
                          <Card key={i}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-bold">{insight.commentator}</CardTitle>
                              {insight.relevantVerse && <CardDescription className="text-[10px]">{insight.relevantVerse}</CardDescription>}
                            </CardHeader>
                            <CardContent><p className="text-xs italic leading-relaxed">"{insight.insight}"</p></CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wiki' && (
                <div className="space-y-8 animate-in fade-in">
                  <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
                    <div>
                      <h1 className="text-3xl font-bold font-headline">Scholarly Wiki</h1>
                      <p className="text-muted-foreground">Collaborative knowledge base for biblical research.</p>
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
                            <DialogDescription>Full citations and bibliographies are mandatory for all contributions.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input placeholder="Article title..." value={newWikiTitle} onChange={e => setNewWikiTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Content</Label>
                              <Textarea placeholder="Main article body..." className="min-h-[200px]" value={newWikiContent} onChange={e => setNewWikiContent(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Works Cited</Label>
                                <Textarea placeholder="List sources used in text..." value={newWikiWorksCited} onChange={e => setNewWikiWorksCited(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>Bibliography</Label>
                                <Textarea placeholder="Full academic bibliography (SBL/Turabian)..." value={newWikiBiblio} onChange={e => setNewWikiBiblio(e.target.value)} />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateWikiEntry} disabled={isLoading}>
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                              Submit for Review
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
                          <Card key={entry.id}>
                            <CardHeader className="bg-primary/5">
                              <CardTitle className="font-headline text-2xl text-primary">{entry.title}</CardTitle>
                              <CardDescription>Contributed by {entry.authorName} • {new Date(entry.createdAt).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                              <div className="prose dark:prose-invert max-w-none leading-relaxed font-serif whitespace-pre-wrap">{entry.content}</div>
                              <Separator />
                              <div className="grid md:grid-cols-2 gap-6 text-[10px]">
                                <div><h4 className="font-bold uppercase text-muted-foreground mb-1">Works Cited</h4>{entry.worksCited}</div>
                                <div><h4 className="font-bold uppercase text-muted-foreground mb-1">Bibliography</h4>{entry.bibliography}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="py-20 text-center text-muted-foreground opacity-30 border-2 border-dashed rounded-xl">
                          <Globe className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg font-headline">No wiki entries found.</p>
                        </div>
                      )}
                    </div>
                    
                    {userProfile?.isAdmin && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 border-b pb-2"><ShieldQuestion className="h-4 w-4" /> Moderation Queue</h3>
                        <ScrollArea className="h-[500px] pr-4">
                          {pendingWikiEntries.map(pending => (
                            <Card key={pending.id} className="mb-4 border-amber-200 bg-amber-50/10">
                              <CardHeader className="p-4"><CardTitle className="text-xs">{pending.title}</CardTitle></CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex flex-col gap-2">
                                  <Button size="sm" className="w-full h-8 text-xs" onClick={() => handleUpdateWikiStatus(pending.id, 'approved')}>Approve Entry</Button>
                                  <Button size="sm" variant="destructive" className="w-full h-8 text-xs" onClick={() => handleUpdateWikiStatus(pending.id, 'rejected')}>Reject</Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {pendingWikiEntries.length === 0 && <p className="text-[10px] italic text-muted-foreground text-center">No pending items.</p>}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'theology-map' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Theology Concept Mapper</h1>
                    <p className="text-muted-foreground">Analyze the systemic development of theological concepts.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. Justification, Atonement..." 
                          value={theoConcept} 
                          onChange={e => setTheoConcept(e.target.value)} 
                        />
                        <Button onClick={() => handleSearch(theoConcept, 'theology')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {theoResult && (
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="font-headline text-2xl">{theoResult.concept}</CardTitle>
                        <CardDescription>{theoResult.etymology}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h4 className="font-bold text-sm uppercase mb-2">Academic Definition</h4>
                          <p className="text-sm italic leading-relaxed">{theoResult.definition}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-bold text-sm uppercase mb-4">Historical Development</h4>
                          <div className="space-y-4">
                            {theoResult.historicalDevelopment.map((h, i) => (
                              <div key={i} className="flex gap-4">
                                <div className="w-24 text-xs font-bold text-primary">{h.period}</div>
                                <div className="flex-1 text-xs">
                                  <p className="font-medium">{h.keyDevelopment}</p>
                                  <p className="text-muted-foreground mt-1">Figures: {h.notableFigures.join(', ')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-6 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Historical Timeline</h1>
                    <p className="text-muted-foreground">Mapping biblical events alongside archaeology and extra-biblical data.</p>
                  </header>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex gap-2">
                        <Input placeholder="e.g. Life of Paul, Babylonian Exile..." value={timelineTopic} onChange={e => setTimelineTopic(e.target.value)} />
                        <Button onClick={() => handleSearch(timelineTopic, 'timeline')} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Milestone className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  {timelineResult && (
                    <div className="relative border-l-2 border-primary/20 ml-4 pl-8 space-y-8">
                      {timelineResult.timeline.map((item, i) => (
                        <div key={i} className="relative">
                          <div className="absolute -left-[41px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                          <div className="space-y-1">
                            <Badge className="mb-1">{item.date}</Badge>
                            <h3 className="font-headline font-bold text-lg">{item.event}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <Badge variant="outline" className="text-[10px]">{item.sourceType}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ai-settings' && (
                <div className="space-y-8 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">AI Engine Configuration</h1>
                    <p className="text-muted-foreground">Select your research engine and manage credentials.</p>
                  </header>
                  <Card>
                    <CardHeader><CardTitle>Model Selection</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div 
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiPrefs.selectedModel === 'googleai/gemini-2.5-flash' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                          onClick={() => setAiPrefs({...aiPrefs, selectedModel: 'googleai/gemini-2.5-flash'})}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Gemini 2.5 Flash</span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">Free/Optimized</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Standard engine. Best for rapid linguistic checks and OCR.</p>
                        </div>
                        <div 
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiPrefs.selectedModel === 'googleai/gemini-2.5-pro-001' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                          onClick={() => setAiPrefs({...aiPrefs, selectedModel: 'googleai/gemini-2.5-pro-001'})}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">Gemini 2.5 Pro</span>
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600">Advanced Tier</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Advanced reasoning. Ideal for deep theological synthesis.</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Google AI API Key</Label>
                        <Input 
                          type="password" 
                          placeholder="Optional: Provide your own key for higher rate limits..." 
                          value={aiPrefs.customApiKey} 
                          onChange={e => setAiPrefs({...aiPrefs, customApiKey: e.target.value})}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => {
                        if (user) {
                          updateDoc(doc(db, 'users', user.uid), { aiPreferences: aiPrefs });
                          toast({ title: 'Preferences saved' });
                        }
                      }}>Save Configuration</Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {activeTab === 'support' && (
                <div className="space-y-8 animate-in fade-in">
                  <header>
                    <h1 className="text-3xl font-bold font-headline">Help & Scholarly Support</h1>
                    <p className="text-muted-foreground">Integrated assistance for your research journey.</p>
                  </header>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="shadow-lg border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Technical Support (osTicket)</CardTitle>
                        <CardDescription>Log technical bugs or access issues directly with our support team.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input placeholder="Issue summary..." value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Problem Description</Label>
                          <Textarea placeholder="Explain the issue in detail..." value={ticketDescription} onChange={e => setTicketDescription(e.target.value)} />
                        </div>
                        <Button className="w-full" onClick={handleCreateTicket} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                          Create osTicket Entry
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg border-primary/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" /> Wiki.js Knowledge Base</CardTitle>
                        <CardDescription>Comprehensive guides on using LexiVerse for academic research.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Our external Wiki.js instance contains tutorials on mastering the original language lexicon, 
                          configuring advanced AI models, and managing bibliographies in SBL style.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg flex flex-col gap-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider">Linguistic Guide</span>
                            <Badge variant="secondary">Article</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider">AI Accuracy Disclosures</span>
                            <Badge variant="secondary">Documentation</Badge>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full gap-2 mt-2">
                          <ExternalLink className="h-4 w-4" /> Open Wiki.js Dashboard
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-primary/5 border-dashed border-2">
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">Need Immediate Assistance?</CardTitle>
                      <CardDescription>Check our system status or reach out via live scholarly chat.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center gap-4">
                       <Button variant="ghost" size="sm" className="gap-2"><Globe className="h-4 w-4" /> System Status</Button>
                       <Button variant="ghost" size="sm" className="gap-2"><MessageSquare className="h-4 w-4" /> Live Support Chat</Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </div>

            {/* Sticky Global Banner Ad */}
            <footer className="mt-12 pt-8 border-t">
              <div 
                className="w-full h-24 bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center group cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => trackAdClick('footer_banner_scholarly', 'footer')}
              >
                <div className="flex flex-col items-center">
                  <Megaphone className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Scholarly Resource Banner</span>
                  <p className="text-xs text-muted-foreground italic">Partner with LexiVerse Explorer</p>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
                <span>© 2024 LexiVerse Explorer</span>
              </div>
            </footer>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
