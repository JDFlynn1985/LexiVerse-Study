
'use client';

import React, { memo, useState } from 'react';
import { BookOpen, Search, Loader2, Download, Save, FileText, Sparkles, Languages } from 'lucide-react';
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
import { searchCommentariesForContext, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';

interface LexiconViewProps {
  handleSearch: (term: string, type: ViewMode) => void;
  handleSaveSession: (title: string, type: string, data: any) => void;
  handleExport: (format: 'pdf' | 'docx' | 'markdown' | 'txt', data: any) => void;
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
  const [commentaryResult, setCommentaryResult] = useState<SearchCommentariesOutput | null>(null);

  const handleDeepCommentary = async () => {
    if (!lexiconResult) return;
    setIsCommentaryLoading(true);
    try {
      const res = await searchCommentariesForContext({
        word: lexiconResult.originalWord,
        language: lexiconResult.searchStrongNumber.startsWith('G') ? 'Greek' : 'Hebrew',
        rootWord: lexiconResult.roots?.[0]?.root
      });
      setCommentaryResult(res);
    } catch (e) {
      console.error("Commentary analysis failed");
    } finally {
      setIsCommentaryLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" /> Lexicon Explorer
          </h1>
          <p className="text-muted-foreground">In-depth original language analysis using Strong's concordance data.</p>
        </div>
        {lexiconResult && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSaveSession(lexiconResult.searchStrongNumber, 'lexicon', lexiconResult)}
              disabled={!isUserSignedIn}
            >
              <Save className="h-4 w-4 mr-2" /> Save to Workspace
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-2">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('pdf', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2" /> DOCX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('markdown', lexiconResult)}>
                  <FileText className="h-4 w-4 mr-2" /> Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter Strong's Number (e.g. G3056)..." 
          className="h-12 shadow-sm" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm, 'lexicon')} 
        />
        <Button 
          size="lg" 
          onClick={() => handleSearch(searchTerm, 'lexicon')} 
          disabled={isLoading || !searchTerm.trim()}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>

      {lexiconResult && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-4xl font-bold font-headline mb-1">{lexiconResult.originalWord}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="font-mono">{lexiconResult.transliteration}</span> | {lexiconResult.pronunciation}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg py-1 px-4">{lexiconResult.searchStrongNumber}</Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Morphology</h4>
                  <Badge variant="outline" className="text-xs uppercase px-3">{lexiconResult.partOfSpeech}</Badge>
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Definition</h4>
                  <p className="text-lg leading-relaxed">{lexiconResult.definition}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Academic Summary</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{lexiconResult.summary}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 bg-background border-accent/20 text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDeepCommentary}
                  disabled={isCommentaryLoading}
                >
                  {isCommentaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Deep Commentary Analysis
                </Button>
                <div className="text-[10px] font-mono text-muted-foreground">SBL BIBLIOGRAPHY READY</div>
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
                  <p className="text-sm italic leading-relaxed text-foreground/80">{commentaryResult.commentarySummary}</p>
                  <div className="grid gap-3">
                    {commentaryResult.specificInsights.map((insight, i) => (
                      <div key={i} className="p-3 bg-background rounded-lg border text-xs leading-relaxed shadow-sm">
                        <span className="font-bold text-accent">{insight.commentator}:</span> {insight.insight}
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
                    <CardTitle className="text-sm font-bold text-primary">{v.reference}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-3">
                    <p className="text-xs italic leading-relaxed mb-2">"{v.text}"</p>
                    <p className="text-[10px] text-muted-foreground">
                      <strong>Nuance:</strong> {v.contextualMeaning}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">Historical Connotations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed italic text-muted-foreground">
                  {lexiconResult.historicalConnotations}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-xl">
              <CardHeader><CardTitle className="text-lg font-headline">Scholarly Sources</CardTitle></CardHeader>
              <CardContent>
                <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap opacity-80">{lexiconResult.bibliography}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});
