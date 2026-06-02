'use client';

import React, { memo, useState } from 'react';
import { BookOpen, Search, Loader2, Download, Save, FileText, Sparkles, Languages, Database, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { ViewMode } from '@/types/scholarly';
import { runCommentaryAggregation } from '@/ai/flows/search-commentaries';

interface LexiconViewProps {
  handleSearch: (term: string, type: ViewMode) => void;
  handleSaveSession: (title: string, type: string, data: any) => void;
  handleExport: (format: 'pdf' | 'docx' | 'markdown' | 'txt' | 'bibtex' | 'gdrive' | 'gdocs', data: any) => void;
  isLoading: boolean;
  lexiconResult: DefineAndAnalyzeTermOutput | null;
  isUserSignedIn: boolean;
}

export const LexiconView = memo(({ 
  handleSearch, 
  handleSaveSession,
  handleExport,
  isLoading, 
  lexiconResult,
  isUserSignedIn
}: LexiconViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [commentaryResult, setCommentaryResult] = useState<any>(null);

  const handleDeepCommentary = async () => {
    if (!lexiconResult) return;
    setIsCommentaryLoading(true);
    try {
      const res = await runCommentaryAggregation({
        query: lexiconResult.originalWord,
      });
      setCommentaryResult(res);
    } catch (e) { console.error("Commentary analysis failed"); }
    finally { setIsCommentaryLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> Lexicon Explorer
          </h1>
          <p className="text-muted-foreground">In-depth original language analysis grounded in verified lexical data.</p>
        </div>
        {lexiconResult && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSaveSession(lexiconResult.searchStrongNumber, 'lexicon', lexiconResult)}
              disabled={!isUserSignedIn}
            >
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Scholarly Formats</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport('pdf', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2" /> PDF Document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('bibtex', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2" /> BibTeX (Zotero)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Google Workspace</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleExport('gdrive', lexiconResult)}>
                  <Database className="h-4 w-4 mr-2 text-primary" /> Save to Drive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('gdocs', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2 text-primary" /> Create Google Doc
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>
      <div className="flex gap-4">
        <Input 
          placeholder="Enter Strong's Number (e.g. G3056, H7225)..." 
          className="h-12 shadow-sm" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm, 'lexicon')} 
        />
        <Button size="lg" onClick={() => handleSearch(searchTerm, 'lexicon')} disabled={isLoading || !searchTerm.trim()}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>
      {lexiconResult && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-4xl font-bold font-headline mb-1">{lexiconResult.originalWord}</CardTitle>
                    <CardDescription className="text-lg">
                      <span className="font-mono">{lexiconResult.transliteration}</span> | {lexiconResult.pronunciation}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary" className="text-lg py-1 px-4">{lexiconResult.searchStrongNumber}</Badge>
                    {lexiconResult.isVerifiedSource && (
                      <Badge variant="outline" className="text-[9px] gap-1 border-green-500/50 text-green-600 bg-green-50/50">
                        <ShieldCheck className="h-3 w-3" /> VERIFIED REGISTRY
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Morphology</h4>
                  <Badge variant="outline" className="text-xs uppercase px-3">{lexiconResult.partOfSpeech}</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Primary Definition</h4>
                  <p className="text-xl leading-relaxed font-serif">{lexiconResult.definition}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Academic Summary</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{lexiconResult.summary}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t flex justify-between">
                <Button variant="outline" size="sm" className="gap-2 bg-background border-accent/20 text-accent hover:bg-accent hover:text-accent-foreground" onClick={handleDeepCommentary} disabled={isCommentaryLoading}>
                  {isCommentaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Commentary Tradition Analysis
                </Button>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">SBL 2nd Edition Style</div>
              </CardFooter>
            </Card>

            {commentaryResult && (
              <Card className="shadow-lg border-accent/20 bg-accent/5 animate-in slide-in-from-bottom-4">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <Languages className="h-5 w-5 text-accent" /> Synthesized Historical Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm italic leading-relaxed text-foreground/80">{commentaryResult.summary}</p>
                  <div className="grid gap-3">
                    {commentaryResult.historicalWorks.map((work: any, i: number) => (
                      <div key={i} className="p-4 bg-background rounded-xl border text-xs leading-relaxed shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-accent">{work.source}</span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">{work.era}</span>
                        </div>
                        <p className="italic text-muted-foreground">"{work.insight}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {lexiconResult.verseOccurrences.map((v, i) => (
                <Card key={i} className="bg-muted/30 border-primary/5 hover:border-primary/20 transition-all group">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-bold text-primary flex justify-between items-center">
                      {v.reference}
                      <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <p className="text-xs italic leading-relaxed mb-2">"{v.text}"</p>
                    <p className="text-[10px] text-muted-foreground"><strong>Linguistic Nuance:</strong> {v.contextualMeaning}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">Historical Connotations</CardTitle></CardHeader>
              <CardContent><p className="text-xs leading-relaxed italic text-muted-foreground">{lexiconResult.historicalConnotations}</p></CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground shadow-xl">
              <CardHeader><CardTitle className="text-lg font-headline">Scholarly Sources</CardTitle></CardHeader>
              <CardContent><p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap opacity-80">{lexiconResult.bibliography}</p></CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});
