
'use client';

import { useState } from 'react';
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
  Settings, 
  Mic, 
  Puzzle,
  Loader2,
  ExternalLink,
  BookMarked,
  Languages,
  MessageSquare,
  History,
  Send
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { compareTranslations, type CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { interactiveVerseExplorationAI } from '@/ai/flows/interactive-verse-exploration-ai';

type ViewMode = 'word-study' | 'verse-explorer' | 'translations' | 'ai-assistant' | 'commentaries';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ViewMode>('word-study');
  const [isLoading, setIsLoading] = useState(false);
  
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

  async function handleWordSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const data = await defineAndAnalyzeTerm({ strongsNumber: searchTerm });
      setWordResult(data);
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
    } catch (error) {
      console.error("Exploration failed:", error);
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2">
            <div className="flex items-center gap-2 px-2 py-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <Languages className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold font-headline truncate group-data-[collapsible=icon]:hidden">LexiVerse</span>
            </div>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Research Tools</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === 'word-study'} 
                      onClick={() => setActiveTab('word-study')}
                      tooltip="Word Studies"
                    >
                      <BookOpen className="mr-2 h-5 w-5"/> 
                      Word Studies
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === 'translations'} 
                      onClick={() => setActiveTab('translations')}
                      tooltip="Translation Compare"
                    >
                      <FileText className="mr-2 h-5 w-5"/> 
                      Translations
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === 'verse-explorer'} 
                      onClick={() => setActiveTab('verse-explorer')}
                      tooltip="Verse Explorer"
                    >
                      <Scroll className="mr-2 h-5 w-5"/> 
                      Verse Explorer
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Interactive</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === 'ai-assistant'} 
                      onClick={() => setActiveTab('ai-assistant')}
                      tooltip="AI Assistant"
                    >
                       <Mic className="mr-2 h-5 w-5"/> 
                      AI Assistant
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Sword Modules">
                      <Puzzle className="mr-2 h-5 w-5"/>
                      Sword Modules
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-4 border-t">
             <div className="flex items-center gap-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                <Info className="h-3 w-3" />
                <span>LexiVerse v1.2</span>
             </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarRail />

        <SidebarInset className="bg-background overflow-y-auto">
          <main className="container max-w-5xl mx-auto py-10 px-6">
            
            {/* WORD STUDY VIEW */}
            {activeTab === 'word-study' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {!wordResult ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <h1 className="text-5xl font-extrabold font-headline text-primary mb-6">Word Study</h1>
                    <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                      Search by Strong's number to unlock linguistic roots, historical context, and academic commentary.
                    </p>
                    <Card className="w-full max-w-md">
                      <CardContent className="pt-6">
                        <form onSubmit={handleWordSearch} className="flex gap-2">
                          <Input 
                            placeholder="e.g., G3056, H1254..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12"
                          />
                          <Button type="submit" size="lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b pb-6">
                      <div>
                        <h2 className="text-5xl font-bold font-headline text-primary">{wordResult.originalWord}</h2>
                        <p className="text-xl text-muted-foreground mt-1">
                          {wordResult.transliteration} • <span className="italic">Pronunciation: {wordResult.pronunciation}</span>
                        </p>
                      </div>
                      <Badge className="text-lg px-4 py-1">{wordResult.searchStrongNumber}</Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                      <Card className="md:col-span-2">
                        <CardHeader><CardTitle className="text-lg">Definition</CardTitle></CardHeader>
                        <CardContent><p className="leading-relaxed">{wordResult.definition}</p></CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle className="text-lg">Lexical Data</CardTitle></CardHeader>
                        <CardContent><pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-2 rounded">{wordResult.lexicalData}</pre></CardContent>
                      </Card>
                    </div>

                    {wordResult.roots && wordResult.roots.length > 0 && (
                      <section>
                        <h3 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
                          <History className="h-5 w-5 text-accent" /> Etymological Roots
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {wordResult.roots.map((root, i) => (
                            <Card key={i} className="border-l-4 border-l-accent">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">{root.root}</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm">
                                <p>{root.definition}</p>
                                <p className="text-xs text-muted-foreground mt-1 italic">{root.lexicalData}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <h3 className="text-2xl font-bold font-headline mb-4">Scholarly Insights</h3>
                      <Accordion type="single" collapsible className="w-full">
                        {wordResult.commentaryInsights.map((insight, i) => (
                          <AccordionItem key={i} value={`insight-${i}`}>
                            <AccordionTrigger className="text-left font-semibold">
                              {insight.commentator} {insight.relevantVerse && `on ${insight.relevantVerse}`}
                            </AccordionTrigger>
                            <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                              {insight.insight}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </section>

                    <Card className="bg-muted">
                      <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Bibliography</CardTitle></CardHeader>
                      <CardContent><p className="text-xs font-mono">{wordResult.bibliography}</p></CardContent>
                    </Card>
                    
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={() => setWordResult(null)}>New Search</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRANSLATION VIEW */}
            {activeTab === 'translations' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col items-center mb-8">
                  <h1 className="text-4xl font-bold font-headline mb-4">Compare Translations</h1>
                  <p className="text-muted-foreground text-center max-w-lg mb-6">
                    Analyze how specific words are translated across major Bible versions.
                  </p>
                  <Card className="w-full max-w-xl">
                    <CardContent className="pt-6">
                      <form onSubmit={handleTranslationCompare} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input 
                          placeholder="Word (e.g. Grace)" 
                          value={transWord}
                          onChange={(e) => setTransWord(e.target.value)}
                          className="md:col-span-2"
                        />
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Compare'}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {transResult && (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {transResult.translations.map((t, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <Badge variant="secondary" className="w-fit">{t.version}</Badge>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-primary mb-2">{t.translation}</p>
                            {t.transliteration && <p className="text-xs text-muted-foreground italic mb-2">{t.transliteration}</p>}
                            <p className="text-sm text-muted-foreground">{t.notes}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Languages className="h-5 w-5" /> Comparative Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="leading-relaxed whitespace-pre-wrap">{transResult.summary}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* VERSE EXPLORER VIEW */}
            {activeTab === 'verse-explorer' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col items-center mb-8">
                  <h1 className="text-4xl font-bold font-headline mb-4">Verse Explorer</h1>
                  <Card className="w-full max-w-2xl">
                    <CardHeader>
                      <CardDescription>Enter a reference and an optional question for deep exploration.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <Input 
                          placeholder="Reference (e.g. Romans 8:28)" 
                          value={verseRef}
                          onChange={(e) => setVerseRef(e.target.value)}
                        />
                        <Textarea 
                          placeholder="What would you like to know about this verse?" 
                          value={verseQuestion}
                          onChange={(e) => setVerseQuestion(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleVerseExploration} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scroll className="h-4 w-4 mr-2" />}
                          Explore Passage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {verseExploration && (
                  <Card className="animate-in slide-in-from-bottom-2 duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookMarked className="h-5 w-5 text-accent" /> Analysis for {verseRef}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="whitespace-pre-wrap leading-relaxed">{verseExploration}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* AI ASSISTANT VIEW */}
            {activeTab === 'ai-assistant' && (
              <div className="flex flex-col h-[70vh] animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-6 border-b pb-4">
                  <Mic className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold font-headline">Theological AI Assistant</h1>
                </div>
                
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-20 text-muted-foreground italic">
                        No messages yet. Ask a question about scripture, theology, or history.
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground border'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2 border animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <form onSubmit={handleAIChat} className="flex gap-2 p-2 bg-card border rounded-xl">
                  <Input 
                    placeholder="Ask the assistant anything..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="border-none focus-visible:ring-0 shadow-none"
                    disabled={isLoading}
                  />
                  <Button size="icon" type="submit" disabled={isLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            )}

          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
