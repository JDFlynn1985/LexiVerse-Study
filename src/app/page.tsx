
'use client';

import { useState, useEffect, useId } from 'react';
import { useTheme } from 'next-themes';
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
  Globe
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { interactiveVerseExplorationAI } from '@/ai/flows/interactive-verse-exploration-ai';
import { aiStudyAssistant, type AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { getVersions, type BibleVersion } from '@/lib/bible-api';

type ViewMode = 'word-study' | 'verse-explorer' | 'translations' | 'ai-assistant' | 'sword-modules' | 'history';

interface Module extends BibleVersion {
  type: 'bible' | 'commentary' | 'lexicon';
  installed: boolean;
  size: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('word-study');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Accessibility IDs
  const wordSearchId = useId();
  const transSearchId = useId();
  const verseRefId = useId();
  const verseQuestionId = useId();
  const chatInputId = useId();

  // History and Bookmarks
  const [history, setHistory] = useState<{id: string, type: string, term: string, date: string}[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Word Study State
  const [searchTerm, setSearchTerm] = useState('');
  const [wordResult, setWordResult] = useState<DefineAndAnalyzeTermOutput | null>(null);

  // Translation State
  const [transWord, setTransWord] = useState('');
  const [transLanguage, setTransLanguage] = useState('Greek');
  const [transResult, setTransResult] = useState<CompareTranslationsOutput | null>(null);

  // Verse Explorer State
  const [verseRef, setVerseRef] = useState('');
  const [verseQuestion, setVerseQuestion] = useState('');
  const [verseExploration, setVerseExploration] = useState<string | null>(null);

  // AI Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [deepResearchResult, setDeepResearchResult] = useState<AiStudyAssistantOutput | null>(null);

  // Sword Modules State (Now fetching from API)
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedBookmarks = localStorage.getItem('lexiverse_bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

    // Fetch real versions for modules
    getVersions().then(vers => {
      setModules(vers.map(v => ({
        ...v,
        type: 'bible',
        installed: v.id === 'kjv',
        size: 'N/A'
      })));
    });
  }, []);

  const addToHistory = (type: string, term: string) => {
    const newEntry = { id: Date.now().toString(), type, term, date: new Date().toLocaleString() };
    const updatedHistory = [newEntry, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    localStorage.setItem('lexiverse_history', JSON.stringify(updatedHistory));
  };

  const toggleBookmark = (item: any) => {
    const exists = bookmarks.find(b => b.term === item.term && b.type === item.type);
    let updated;
    if (exists) {
      updated = bookmarks.filter(b => b.id !== exists.id);
    } else {
      updated = [...bookmarks, { ...item, id: Date.now().toString() }];
    }
    setBookmarks(updated);
    localStorage.setItem('lexiverse_bookmarks', JSON.stringify(updated));
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ title: 'LexiVerse Research', text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    }
  };

  async function handleWordSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const data = await defineAndAnalyzeTerm({ strongsNumber: searchTerm });
      setWordResult(data);
      addToHistory('word', searchTerm);
      setActiveTab('word-study');
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
        language: transLanguage, 
        versions: ['KJV', 'NIV', 'ESV', 'NASB'] 
      });
      setTransResult(data);
      addToHistory('translation', transWord);
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
        question: verseQuestion || `Explain the significance of ${verseRef} using the real passage text.`,
        history: []
      });
      setVerseExploration(data.response);
      addToHistory('verse', verseRef);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeepResearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    setIsLoading(true);
    try {
      const data = await aiStudyAssistant({ term: chatInput });
      setDeepResearchResult(data);
      addToHistory('research', chatInput);
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
        term: 'Interactive Session',
        question: userMsg,
        history: chatHistory
      });
      setChatHistory(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, installed: !m.installed } : m));
  };

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
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'word-study', label: 'Lexicon', icon: BookOpen },
                    { id: 'translations', label: 'Versions', icon: FileText },
                    { id: 'verse-explorer', label: 'Verse Explorer', icon: Scroll },
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
                <SidebarGroupLabel>System</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'ai-assistant', label: 'Scholar AI', icon: Mic },
                    { id: 'sword-modules', label: 'Library', icon: Puzzle },
                    { id: 'history', label: 'Logs', icon: History },
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
          <SidebarFooter className="p-4 border-t">
             <div className="flex justify-between items-center group-data-[collapsible=icon]:hidden">
                <span className="text-[10px] text-muted-foreground uppercase">API Powered</span>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
             </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background overflow-y-auto">
          <main className="container max-w-5xl mx-auto py-10 px-6">
            
            {activeTab === 'word-study' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {!wordResult ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <h1 className="text-4xl font-bold font-headline text-primary mb-4">Semantic Lexicon</h1>
                    <p className="text-muted-foreground mb-8 max-w-md">Search Strong's numbers or original terms for deep morphological analysis.</p>
                    <Card className="w-full max-w-md border shadow-lg">
                      <CardContent className="pt-6">
                        <form onSubmit={handleWordSearch} className="flex gap-2">
                          <Input 
                            id={wordSearchId}
                            placeholder="e.g. G3056" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11"
                          />
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Study'}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <article className="space-y-6">
                    <header className="flex justify-between items-end border-b pb-6">
                      <div>
                        <h1 className="text-5xl font-bold font-headline text-primary">{wordResult.originalWord}</h1>
                        <p className="text-lg text-muted-foreground italic">{wordResult.transliteration} • {wordResult.pronunciation}</p>
                      </div>
                      <Badge className="bg-primary px-4 py-1">{wordResult.searchStrongNumber}</Badge>
                    </header>
                    <div className="grid gap-6 md:grid-cols-2">
                      <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-lg font-headline">Lexical Definition</CardTitle></CardHeader>
                        <CardContent><p className="leading-relaxed">{wordResult.definition}</p></CardContent>
                      </Card>
                      <Card className="shadow-sm">
                        <CardHeader><CardTitle className="text-lg font-headline">Parsing Data</CardTitle></CardHeader>
                        <CardContent><pre className="text-xs bg-muted p-3 rounded font-mono">{wordResult.lexicalData}</pre></CardContent>
                      </Card>
                    </div>
                    <Button variant="outline" onClick={() => setWordResult(null)}>New Search</Button>
                  </article>
                )}
              </div>
            )}

            {activeTab === 'verse-explorer' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="text-center mb-10">
                  <h1 className="text-3xl font-bold font-headline mb-2">Verse Analytics</h1>
                  <p className="text-muted-foreground">Contextual passage analysis powered by live scripture data.</p>
                </header>
                <Card className="max-w-2xl mx-auto shadow-md">
                  <CardContent className="pt-6 space-y-4">
                    <form onSubmit={handleVerseExploration} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={verseRefId}>Bible Reference</Label>
                        <Input 
                          id={verseRefId}
                          placeholder="John 1:1" 
                          value={verseRef}
                          onChange={(e) => setVerseRef(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={verseQuestionId}>Theological Inquiry (Optional)</Label>
                        <Textarea 
                          id={verseQuestionId}
                          placeholder="What is the significance of the logos here?" 
                          value={verseQuestion}
                          onChange={(e) => setVerseQuestion(e.target.value)}
                        />
                      </div>
                      <Button className="w-full h-11" type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scroll className="h-4 w-4 mr-2" />}
                        Analyze Passage
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                {verseExploration && (
                  <Card className="mt-8 border-l-4 border-l-accent shadow-lg animate-in slide-in-from-top-4">
                    <CardHeader className="border-b bg-muted/20">
                      <CardTitle className="text-xl font-headline flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-accent" /> Analysis: {verseRef}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-6">
                      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{verseExploration}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'sword-modules' && (
              <div className="space-y-8 animate-in fade-in">
                <header className="flex justify-between items-end border-b pb-6">
                  <div>
                    <h1 className="text-3xl font-bold font-headline">Digital Library</h1>
                    <p className="text-muted-foreground text-sm">Managing versions from bible.helloao.org and SWORD interface.</p>
                  </div>
                </header>
                <div className="grid gap-4 sm:grid-cols-2">
                  {modules.map((mod) => (
                    <Card key={mod.id} className={`p-4 border shadow-sm ${mod.installed ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-3 items-center">
                          <div className={`p-2 rounded ${mod.installed ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <Book className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold">{mod.name}</h3>
                            <p className="text-[10px] uppercase text-muted-foreground">{mod.language} • {mod.abbreviation}</p>
                          </div>
                        </div>
                        <Button size="sm" variant={mod.installed ? 'outline' : 'default'} onClick={() => toggleModule(mod.id)}>
                          {mod.installed ? 'Remov' : 'Add'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* AI Assistant, History, and Translations logic remains integrated with the same UI pattern */}
            {activeTab === 'ai-assistant' && (
               <div className="flex flex-col h-[70vh] gap-4">
                 <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/5">
                   <div className="space-y-4">
                     {chatHistory.map((m, i) => (
                       <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                           <p className="text-sm">{m.content}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </ScrollArea>
                 <form onSubmit={handleAIChat} className="flex gap-2">
                   <Input 
                     id={chatInputId}
                     placeholder="Ask the Scholar AI..." 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                   />
                   <Button type="submit" size="icon" disabled={isLoading}><Send className="h-4 w-4" /></Button>
                 </form>
               </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold font-headline">Session Logs</h1>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {history.map(h => (
                        <div key={h.id} className="p-4 flex justify-between items-center hover:bg-muted/30 cursor-pointer" onClick={() => setActiveTab(h.type as any)}>
                          <div className="flex gap-3">
                            <Badge variant="outline">{h.type.toUpperCase()}</Badge>
                            <span className="font-medium">{h.term}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{h.date}</span>
                        </div>
                      ))}
                    </div>
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
