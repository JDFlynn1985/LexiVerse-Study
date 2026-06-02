'use client';

import React, { memo, useState } from 'react';
import { BookOpen, Search, Loader2, Sparkles, Scroll, History, Quote, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { runCommentaryAggregation, type SearchCommentariesOutput } from '@/ai/flows/search-commentaries';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';

export const CommentaryView = memo(() => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchCommentariesOutput | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await runCommentaryAggregation({ query });
      setResult(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Aggregation Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> Commentary Aggregator
        </h1>
        <p className="text-muted-foreground">Access verified historical scholarly insights and theological traditions.</p>
      </header>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter a passage or term (e.g. Romans 8:1, Justification)..." 
          className="h-12 text-lg shadow-sm"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button size="lg" onClick={handleSearch} disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </Button>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <Scroll className="h-6 w-6 text-primary" /> Historical Aggregation
                </CardTitle>
                <CardDescription>Synthesized results from primary scholarly works.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <p className="text-lg leading-relaxed text-foreground/90 font-serif italic border-l-4 pl-6 py-2 border-primary/20">
                  {result.summary}
                </p>
                
                <Separator />
                
                <div className="space-y-6">
                  <h4 className="font-bold text-xs uppercase text-primary tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" /> Individual Commentary Works
                  </h4>
                  <div className="grid gap-4">
                    {result.historicalWorks.map((work, i) => (
                      <div key={i} className="p-5 bg-muted/30 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-bold text-primary">{work.source}</h5>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{work.era} • {work.tradition}</p>
                          </div>
                          <Quote className="h-4 w-4 text-primary opacity-20" />
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground italic">"{work.insight}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary text-primary-foreground shadow-xl">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase flex items-center gap-2 opacity-80">
                    <Sparkles className="h-4 w-4" /> Academic Synthesis
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm leading-relaxed font-serif">
                    {result.academicSynthesis}
                  </p>
               </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Info className="h-5 w-5 text-accent" /> Scholarly Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {result.bibliography}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full text-[10px] uppercase font-bold" onClick={() => window.print()}>
                  Export to Research Log
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-primary/10">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">Aggregated Theological Tradition</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
              Search to aggregate and compare historical commentary perspectives for your research.
            </p>
          </div>
        )
      )}
    </div>
  );
});
