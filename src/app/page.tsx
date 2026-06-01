
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
  Book
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

type ViewMode = 'word-study' | 'verse-explorer' | 'translations' | 'ai-assistant' | 'sword-modules' | 'history';

interface Module {
  id: string;
  name: string;
  type: 'bible' | 'commentary' | 'lexicon';
  version: string;
  installed: boolean;
  size: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('word-study');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // IDs for accessibility
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

  // Sword Modules State
  const [modules, setModules] = useState<Module[]>([
    { id: 'kjv', name: 'King James Version', type: 'bible', version: '1769', installed: true, size: '4.2MB' },
    { id: 'net', name: 'New English Translation', type: 'bible', version: '2.1', installed: false, size: '5.8MB' },
    { id: 'mh', name: 'Matthew Henry Commentary', type: 'commentary', version: 'Concise', installed: false, size: '12MB' },
    { id: 'strongs', name: 'Strong\'s Hebrew/Greek Lexicon', type: 'lexicon', version: '2024', installed: true, size: '3.1MB' },
  ]);

  // Handle Hydration
  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem('lexiverse_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedBookmarks = localStorage.getItem('lexiverse_bookmarks');
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
  }, []);

  // Save History to LocalStorage
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
      navigator.share({
        title: 'LexiVerse Research Results',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Link copied to clipboard');
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
      console.error("Search failed:", error);
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
      console.error("Comparison failed:", error);
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
        question: verseQuestion || `Explain the significance of ${verseRef} in its original context.`,
        history: []
      });
      setVerseExploration(data.response);
      addToHistory('verse', verseRef);
    } catch (error) {
      console.error("Exploration failed:", error);
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
      console.error("Research failed:", error);
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
        term: 'General Theology',
        question: userMsg,
        history: chatHistory
      });
      setChatHistory(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
      console.error("Chat failed:", error);
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
      <div className="flex min-h-screen w-full transition-colors duration-300">
        <Sidebar side="left" variant="inset" collapsible="icon" role="navigation" aria-label="Main Navigation">
          <SidebarHeader className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-md" aria-hidden="true">
                <Languages className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold font-headline tracking-tight group-data-[collapsible=icon]:hidden">LexiVerse</span>
            </div>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Research Tools</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'word-study', label: 'Word Studies', icon: BookOpen },
                    { id: 'translations', label: 'Translations', icon: FileText },
                    { id: 'verse-explorer', label: 'Verse Explorer', icon: Scroll },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                      >
                        <item.icon className="mr-2 h-5 w-5" aria-hidden="true" /> 
                        {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Interactive</SidebarGroupLabel>
                <SidebarMenu>
                  {[
                    { id: 'ai-assistant', label: 'AI Assistant', icon: Mic },
                    { id: 'sword-modules', label: 'Sword Modules', icon: Puzzle },
                    { id: 'history', label: 'Recent Activity', icon: History },
                  ].map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id as ViewMode)}
                        tooltip={item.label}
                        aria-current={activeTab === item.id ? 'page' : undefined}
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
          <SidebarFooter className="p-4 border-t bg-muted/30">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" aria-hidden="true" />
                    <span>v1.6 Scholar</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Switch Theme">
                        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="hidden group-data-[collapsible=icon]:flex justify-center">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </Button>
                </div>
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarRail />

        <SidebarInset className="bg-background overflow-y-auto" role="main" aria-label="Main Content Area">
          <main className="container max-w-6xl mx-auto py-10 px-6">
            
            {/* WORD STUDY VIEW */}
            {activeTab === 'word-study' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {!wordResult ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <h1 className="text-5xl font-extrabold font-headline text-primary mb-6 drop-shadow-sm">Lexical Research</h1>
                    <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                      Deep linguistic analysis for Hebrew, Greek, and Aramaic. Optimized for seminary-level study.
                    </p>
                    <Card className="w-full max-w-lg border-2 border-primary/10 shadow-xl dark:bg-card/50">
                      <CardContent className="pt-6">
                        <form onSubmit={handleWordSearch} className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2 text-left">
                            <Label htmlFor={wordSearchId}>Strong's Number or Greek/Hebrew word</Label>
                            <div className="flex gap-2">
                              <Input 
                                id={wordSearchId}
                                placeholder="e.g., G3056, Logos" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 text-lg"
                                aria-required="true"
                              />
                              <Button type="submit" size="lg" disabled={isLoading} className="shadow-lg">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-5 w-5 mr-2" />}
                                Study
                              </Button>
                            </div>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <article className="space-y-8">
                    <header className="flex flex-wrap items-center justify-between border-b pb-6 gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="text-5xl font-bold font-headline text-primary">{wordResult.originalWord}</h1>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleBookmark({ term: wordResult.originalWord, type: 'word' })}
                              aria-label={bookmarks.some(b => b.term === wordResult.originalWord) ? "Remove Bookmark" : "Add Bookmark"}
                            >
                               <Bookmark className={`h-6 w-6 ${bookmarks.some(b => b.term === wordResult.originalWord) ? 'fill-accent text-accent' : ''}`} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleShare(`${wordResult.originalWord}: ${wordResult.definition}`)}
                              aria-label="Share Result"
                            >
                               <Share2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xl text-muted-foreground mt-1">
                          {wordResult.transliteration} • <span className="italic">Pronunciation: {wordResult.pronunciation}</span>
                        </p>
                      </div>
                      <Badge className="text-lg px-6 py-2 bg-primary shadow-md">
                        {wordResult.searchStrongNumber}
                      </Badge>
                    </header>

                    <div className="grid gap-6 md:grid-cols-3">
                      <Card className="md:col-span-2 shadow-sm dark:bg-card/30">
                        <CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Book className="h-5 w-5 text-accent"/> Lexical Definition</CardTitle></CardHeader>
                        <CardContent><p className="leading-relaxed text-lg">{wordResult.definition}</p></CardContent>
                      </Card>
                      <Card className="shadow-sm dark:bg-card/30">
                        <CardHeader><CardTitle className="text-xl font-headline flex items-center gap-2"><Scroll className="h-5 w-5 text-accent"/> Technical Data</CardTitle></CardHeader>
                        <CardContent>
                          <ScrollArea className="h-48">
                            <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded-lg border dark:bg-muted/50">
                              {wordResult.lexicalData}
                            </pre>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    {wordResult.roots && wordResult.roots.length > 0 && (
                      <section className="bg-accent/5 p-6 rounded-2xl border border-accent/20 dark:bg-accent/10">
                        <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2 text-primary">
                          <History className="h-6 w-6 text-accent" /> Etymological Roots
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {wordResult.roots.map((root, i) => (
                            <Card key={i} className="border-l-4 border-l-accent bg-card/50 shadow-sm dark:bg-card/30">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-primary">{root.root}</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm">
                                <p className="font-medium mb-1">{root.definition}</p>
                                <p className="text-xs text-muted-foreground italic">{root.lexicalData}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
                        <Feather className="h-6 w-6 text-accent" /> Academic Commentaries
                      </h2>
                      <Accordion type="single" collapsible className="w-full space-y-2">
                        {wordResult.commentaryInsights.map((insight, i) => (
                          <AccordionItem key={i} value={`insight-${i}`} className="border rounded-lg px-4 bg-card/50 shadow-sm dark:bg-card/30">
                            <AccordionTrigger className="text-left font-semibold py-4 hover:no-underline">
                              <span className="flex items-center gap-2">
                                <BookMarked className="h-4 w-4 text-primary/50" />
                                {insight.commentator} {insight.relevantVerse && <span className="text-muted-foreground font-normal ml-2">on {insight.relevantVerse}</span>}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed text-muted-foreground pb-4 border-t pt-4">
                              {insight.insight}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </section>
                    
                    <div className="flex justify-center pt-8">
                      <Button variant="outline" size="lg" onClick={() => setWordResult(null)} className="px-10">New Research Study</Button>
                    </div>
                  </article>
                )}
              </div>
            )}

            {/* TRANSLATION VIEW */}
            {activeTab === 'translations' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex flex-col items-center mb-8">
                  <h1 className="text-4xl font-bold font-headline mb-4">Multi-Version Comparison</h1>
                  <p className="text-muted-foreground text-center max-w-lg mb-6 text-lg">
                    Discover theological nuances across KJV, NIV, ESV, and NASB.
                  </p>
                  <Card className="w-full max-w-2xl border-2 border-accent/20 shadow-lg dark:bg-card/30">
                    <CardContent className="pt-6">
                      <form onSubmit={handleTranslationCompare} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input 
                            id={transSearchId}
                            placeholder="Term (e.g. Logos, Love)" 
                            value={transWord}
                            onChange={(e) => setTransWord(e.target.value)}
                            className="md:col-span-3 h-12"
                            aria-label="Word to compare"
                          />
                          <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </header>

                {transResult && (
                  <section className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {transResult.translations.map((t, i) => (
                        <Card key={i} className="hover:shadow-lg transition-all border-t-4 border-t-primary dark:bg-card/30">
                          <CardHeader className="pb-2">
                            <Badge className="w-fit bg-secondary text-secondary-foreground">{t.version}</Badge>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold text-primary mb-3">{t.translation}</p>
                            {t.originalWord && <p className="text-sm font-headline text-accent font-semibold">{t.originalWord}</p>}
                            {t.transliteration && <p className="text-xs text-muted-foreground italic mb-3">{t.transliteration}</p>}
                            <p className="text-sm text-muted-foreground leading-relaxed">{t.notes}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="bg-primary text-primary-foreground border-none shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Languages className="h-24 w-24" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-2xl flex items-center justify-between font-headline">
                          <div className="flex items-center gap-2">
                             <Languages className="h-6 w-6" /> Comparative Summary
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary-foreground hover:bg-white/10"
                            onClick={() => handleShare(transResult.summary)}
                            aria-label="Share Summary"
                          >
                             <Share2 className="h-5 w-5" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed text-lg whitespace-pre-wrap font-light italic">"{transResult.summary}"</p>
                      </CardContent>
                    </Card>
                  </section>
                )}
              </div>
            )}

            {/* VERSE EXPLORER VIEW */}
            {activeTab === 'verse-explorer' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex flex-col items-center mb-8">
                  <h1 className="text-4xl font-bold font-headline mb-4">Inter-Verse Analytics</h1>
                  <p className="text-muted-foreground mb-6">Cross-reference analysis and contextual passage deep-dives.</p>
                  <Card className="w-full max-w-3xl shadow-xl border-t-4 border-t-accent dark:bg-card/30">
                    <CardHeader>
                      <CardDescription className="text-base">Passage breakdown for scholarly inquiry.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <form className="grid gap-4" onSubmit={handleVerseExploration}>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={verseRefId}>Passage Reference</Label>
                          <Input 
                            id={verseRefId}
                            placeholder="e.g. John 1:1, Romans 8:28" 
                            value={verseRef}
                            onChange={(e) => setVerseRef(e.target.value)}
                            className="h-12 text-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={verseQuestionId}>Specific Inquiry</Label>
                          <Textarea 
                            id={verseQuestionId}
                            placeholder="What are the linguistic nuances of this passage?" 
                            value={verseQuestion}
                            onChange={(e) => setVerseQuestion(e.target.value)}
                            className="min-h-[100px] dark:bg-muted/30"
                          />
                        </div>
                        <Button className="w-full h-12 text-lg shadow-md" type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Scroll className="h-5 w-5 mr-2" />}
                          Analyze Passage
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </header>

                {verseExploration && (
                  <Card className="animate-in slide-in-from-bottom-2 duration-300 border shadow-lg bg-card/50 dark:bg-card/30">
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center justify-between font-headline">
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-6 w-6 text-accent" /> Analysis: {verseRef}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleBookmark({ term: verseRef, type: 'verse', content: verseExploration })}
                          >
                             <Bookmark className={`h-4 w-4 mr-2 ${bookmarks.some(b => b.term === verseRef) ? 'fill-accent text-accent' : ''}`} />
                             Bookmark
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleShare(verseExploration)}>
                            <Share2 className="h-4 w-4 mr-2" /> Share
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-8">
                      <div className="prose prose-slate max-w-none text-muted-foreground leading-loose text-lg dark:prose-invert">
                        <p className="whitespace-pre-wrap">{verseExploration}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* AI ASSISTANT VIEW */}
            {activeTab === 'ai-assistant' && (
              <div className="flex flex-col h-[75vh] animate-in fade-in duration-500">
                <header className="flex items-center justify-between mb-6 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mic className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold font-headline">Scholar AI Assistant</h1>
                      <p className="text-xs text-muted-foreground italic">Consulting academic archives...</p>
                    </div>
                  </div>
                  <Tabs defaultValue="chat" className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chat">Conversational</TabsTrigger>
                      <TabsTrigger value="deep">Deep Research</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </header>
                
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6 pb-6">
                      {deepResearchResult && (
                        <Card className="border-2 border-primary/20 shadow-lg bg-accent/5 dark:bg-card/30 mb-8 overflow-hidden">
                          <CardHeader className="bg-primary text-primary-foreground">
                            <div className="flex justify-between items-center">
                              <div>
                                <CardTitle className="font-headline text-2xl">Research: {deepResearchResult.originalWord}</CardTitle>
                                <CardDescription className="text-primary-foreground/80">{deepResearchResult.transliteration} | {deepResearchResult.pronunciation}</CardDescription>
                              </div>
                              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => handleShare(deepResearchResult.aiInsights)}>
                                <Share2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-6 space-y-6">
                            <div>
                              <h2 className="font-bold text-primary dark:text-accent uppercase text-xs tracking-widest mb-2 border-b pb-1">Definitions</h2>
                              <ul className="list-disc pl-5 space-y-1">
                                {deepResearchResult.definitions.map((d, i) => <li key={i} className="text-muted-foreground">{d}</li>)}
                              </ul>
                            </div>
                            <div className="bg-card p-4 rounded border shadow-inner dark:bg-muted/20">
                              <h2 className="font-bold text-primary dark:text-accent uppercase text-xs tracking-widest mb-2">AI Theological Insights</h2>
                              <p className="text-sm leading-relaxed">{deepResearchResult.aiInsights}</p>
                            </div>
                            <div className="pt-4 border-t text-[10px] font-mono opacity-60">
                              <h2 className="font-bold uppercase mb-2">Bibliography</h2>
                              <p className="whitespace-pre-wrap">{deepResearchResult.bibliography}</p>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted/30">
                             <Button variant="ghost" size="sm" onClick={() => setDeepResearchResult(null)} className="text-destructive">Discard Report</Button>
                          </CardFooter>
                        </Card>
                      )}

                      {chatHistory.length === 0 && !deepResearchResult && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                          <MessageSquare className="h-16 w-16 mb-4" />
                          <h2 className="text-xl font-semibold">Academic Consultation</h2>
                          <p className="max-w-xs text-sm mt-2 italic">"An unexamined life is not worth living."</p>
                        </div>
                      )}

                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${
                              msg.role === 'user' 
                              ? 'bg-primary text-primary-foreground rounded-br-none' 
                              : 'bg-card border text-foreground rounded-bl-none dark:bg-card/40'
                            }`}
                          >
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-6 py-4 border animate-pulse flex items-center gap-3 dark:bg-muted/30">
                            <div className="flex gap-1">
                              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-100"></div>
                              <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-200"></div>
                            </div>
                            <span className="text-xs text-muted-foreground">Analyzing text...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <form 
                    onSubmit={(e) => {
                      const activeTabTrigger = document.querySelector('[role="tab"][data-state="active"]') as HTMLElement;
                      if (activeTabTrigger?.innerText.includes('Deep')) handleDeepResearch(e);
                      else handleAIChat(e);
                    }} 
                    className="flex flex-col gap-2 p-3 bg-card border-2 border-primary/10 rounded-2xl shadow-xl dark:bg-card/40"
                  >
                    <div className="flex gap-3">
                      <Input 
                        id={chatInputId}
                        placeholder="Inquire about a term or doctrine..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="border-none focus-visible:ring-0 shadow-none text-lg bg-transparent"
                        disabled={isLoading}
                      />
                      <div className="flex gap-2">
                         <Button size="icon" type="submit" disabled={isLoading || !chatInput.trim()} className="rounded-xl h-11 w-11">
                           <Send className="h-5 w-5" />
                         </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SWORD MODULES VIEW */}
            {activeTab === 'sword-modules' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="flex justify-between items-end border-b pb-6">
                  <div>
                    <h1 className="text-4xl font-bold font-headline">Sword Module Manager</h1>
                    <p className="text-muted-foreground mt-2">Manage scholarly resources for deep-dive analysis.</p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" /> Update Repository
                  </Button>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                  {modules.map((mod) => (
                    <Card key={mod.id} className={`overflow-hidden transition-all border-2 ${mod.installed ? 'border-primary/10' : 'border-dashed dark:bg-card/10'}`}>
                      <div className="flex items-center p-6 gap-4">
                        <div className={`p-4 rounded-xl ${mod.installed ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {mod.type === 'bible' ? <BookOpen className="h-8 w-8" /> : mod.type === 'commentary' ? <Feather className="h-8 w-8" /> : <Scroll className="h-8 w-8" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-xl font-headline">{mod.name}</h2>
                            {mod.installed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex gap-2 mt-1">
                             <Badge variant="outline" className="text-[10px]">{mod.type.toUpperCase()}</Badge>
                             <span className="text-xs text-muted-foreground">v{mod.version} • {mod.size}</span>
                          </div>
                        </div>
                        <Button 
                          variant={mod.installed ? 'destructive' : 'default'} 
                          size="sm" 
                          onClick={() => toggleModule(mod.id)}
                        >
                          {mod.installed ? 'Uninstall' : 'Install'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* HISTORY VIEW */}
            {activeTab === 'history' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <section>
                  <h1 className="text-4xl font-bold font-headline mb-8 flex items-center gap-3">
                    <BookMarked className="h-8 w-8 text-accent" /> Bookmarked Studies
                  </h1>
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed italic text-muted-foreground">
                      No bookmarks saved yet. Click the bookmark icon on any research result.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {bookmarks.map((b) => (
                        <Card key={b.id} className="hover:shadow-md transition-all cursor-pointer dark:bg-card/30" onClick={() => {
                          if (b.type === 'word') { setSearchTerm(b.term); handleWordSearch(); }
                          else if (b.type === 'verse') { setVerseRef(b.term); setVerseExploration(b.content); setActiveTab('verse-explorer'); }
                        }}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <Badge variant="secondary" className="w-fit mb-1">{b.type.toUpperCase()}</Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive" 
                                onClick={(e) => { e.stopPropagation(); toggleBookmark(b); }}
                                aria-label="Delete Bookmark"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <CardTitle className="text-lg font-headline">{b.term}</CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-xs text-muted-foreground line-clamp-3">{b.content || 'Saved word study analysis'}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h1 className="text-4xl font-bold font-headline mb-8 flex items-center gap-3">
                    <History className="h-8 w-8 text-accent" /> Research History
                  </h1>
                  <Card className="border shadow-sm bg-card/50 dark:bg-card/30">
                    <CardContent className="p-0">
                      {history.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground italic">No research recorded.</div>
                      ) : (
                        <div className="divide-y">
                          {history.map((h) => (
                            <div 
                              key={h.id} 
                              className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors cursor-pointer" 
                              onClick={() => {
                               if (h.type === 'word') { setSearchTerm(h.term); handleWordSearch(); }
                               else if (h.type === 'verse') { setVerseRef(h.term); setActiveTab('verse-explorer'); }
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded bg-muted dark:bg-muted/50">
                                  {h.type === 'word' ? <BookOpen className="h-4 w-4" /> : <Scroll className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold">{h.term}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{h.type}</p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{h.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>
            )}

          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
