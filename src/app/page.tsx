
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
  BookMarked
} from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { defineAndAnalyzeTerm, type DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DefineAndAnalyzeTermOutput | null>(null);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const data = await defineAndAnalyzeTerm({ strongsNumber: searchTerm });
      setResult(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar side="left" variant="inset" collapsible="icon">
          <SidebarHeader className="p-2">
            <form onSubmit={handleSearch} className="relative">
              <SidebarInput 
                placeholder="Search Strong's (e.g. G1234)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </form>
            <SidebarMenuButton
              variant="outline"
              size="lg"
              tooltip="LexiVerse Explorer" 
              className="text-headline font-bold text-lg h-12 w-full justify-center mt-2"
            >
              LexiVerse
            </SidebarMenuButton>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Explore</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={true} tooltip="Word Studies">
                      <BookOpen className="mr-2 h-5 w-5"/> 
                      Word Studies
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Verse Explorer">
                      <Scroll className="mr-2 h-5 w-5"/> 
                      Verse Explorer
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Commentaries">
                      <Feather className="mr-2 h-5 w-5"/> 
                      Commentaries
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Translations">
                      <FileText className="mr-2 h-5 w-5"/> 
                      Translations
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

              <SidebarGroup>
                <SidebarGroupLabel>Tools</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="AI Assistant">
                       <Mic className="mr-2 h-5 w-5"/> 
                      AI Assistant
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings">
                      <Settings className="mr-2 h-5 w-5"/> 
                      Settings
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="About">
                      <Info className="mr-2 h-5 w-5"/> 
                      About
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter>
             <SidebarMenuButton variant="outline" tooltip="Export Current Study" className="w-full">
               Export Study
             </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <SidebarRail />

        <SidebarInset className="bg-background overflow-y-auto">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
              <h1 className="text-6xl font-extrabold font-headline text-primary mb-6">LexiVerse Explorer</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Perform deep academic research on biblical terms using Strong's numbers. 
                Trace roots, explore commentaries, and analyze historical context.
              </p>
              <div className="w-full max-w-md bg-card p-6 rounded-xl border shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <SidebarInput 
                    placeholder="Enter Strong's number (e.g., G3056, H7225)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12 text-lg"
                  />
                  <Button type="submit" size="lg" disabled={isLoading} className="font-semibold">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                  </Button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => { setSearchTerm('G3056'); }}>G3056 (Logos)</Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => { setSearchTerm('H1254'); }}>H1254 (Bara)</Badge>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80" onClick={() => { setSearchTerm('G1722'); }}>G1722 (En)</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Header Section */}
              <div className="border-b pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-5xl font-bold font-headline text-primary">{result.originalWord}</h2>
                    <p className="text-xl text-muted-foreground mt-1">
                      {result.transliteration} • <span className="italic">Pronounced: {result.pronunciation}</span>
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-1">{result.searchStrongNumber}</Badge>
                </div>
                <p className="text-lg leading-relaxed">{result.definition}</p>
              </div>

              {/* Lexical Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-accent" />
                    Lexical Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {result.lexicalData}
                  </p>
                </CardContent>
              </Card>

              {/* Roots Analysis */}
              {result.roots && result.roots.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold font-headline mb-4">Etymological Roots</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.roots.map((root, i) => (
                      <Card key={i} className="border-l-4 border-l-accent">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{root.root}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm">{root.definition}</p>
                          <p className="text-xs text-muted-foreground italic">{root.lexicalData}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Commentary Insights */}
              <section>
                <h3 className="text-2xl font-bold font-headline mb-4">Commentary & Historical Context</h3>
                <Accordion type="single" collapsible className="w-full">
                  {result.commentaryInsights.map((insight, i) => (
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
                <div className="mt-6 bg-secondary/50 p-6 rounded-xl border border-dashed">
                  <h4 className="font-bold mb-2">Synthesis Summary</h4>
                  <p className="text-sm italic">{result.summary}</p>
                </div>
              </section>

              {/* Scripture Usage */}
              <section>
                <h3 className="text-2xl font-bold font-headline mb-4">Scripture References</h3>
                <div className="flex flex-wrap gap-2">
                  {result.scriptureReferences.map((ref, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1 cursor-default hover:bg-accent/10">
                      {ref}
                    </Badge>
                  ))}
                </div>
              </section>

              {/* Sources & Bibliography */}
              <footer className="pt-8 border-t text-xs text-muted-foreground space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    <span>Data aggregated from BlueLetterBible and scholarly commentaries.</span>
                  </div>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">Report Discrepancy</Button>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <h5 className="font-bold mb-1 uppercase tracking-wider text-[10px]">Academic Bibliography</h5>
                  <p className="whitespace-pre-wrap font-mono leading-tight">{result.bibliography}</p>
                </div>
              </footer>
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
