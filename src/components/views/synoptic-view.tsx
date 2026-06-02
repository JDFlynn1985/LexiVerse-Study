'use client';

import React, { memo, useState } from 'react';
import { Layers, Search, Loader2, Sparkles, BookOpen, Quote, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { alignSynopticGospels, type SynopticOutput } from '@/ai/flows/synoptic-aligner-flow';
import { useToast } from '@/hooks/use-toast';

export const SynopticView = memo(() => {
  const { toast } = useToast();
  const [event, setEvent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SynopticOutput | null>(null);

  const handleAlign = async () => {
    if (!event.trim()) return;
    setIsLoading(true);
    try {
      const data = await alignSynopticGospels(event);
      setResult(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Alignment Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" /> Synoptic Aligner
        </h1>
        <p className="text-muted-foreground">Map and compare narrative events across the four Gospel traditions.</p>
      </header>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter a Gospel event (e.g. Feeding of the 5000, The Transfiguration)..." 
          className="h-12 text-lg shadow-sm"
          value={event}
          onChange={e => setEvent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAlign()}
        />
        <Button size="lg" onClick={handleAlign} disabled={isLoading || !event.trim()}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
        </Button>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{result.eventName}</CardTitle>
                <CardDescription>Synoptic Reference Alignment</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {result.alignments.map((a, i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-xl border border-primary/5 hover:border-primary/20 transition-all flex flex-col justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2 text-[10px] uppercase font-bold">{a.gospel}</Badge>
                      <p className="font-bold text-primary mb-2">{a.reference}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{a.keyNuance}"</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground shadow-xl">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase flex items-center gap-2 opacity-80">
                    <BookOpen className="h-4 w-4" /> Scholarly Synthesis
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm leading-relaxed font-serif italic">
                    {result.theologicalSynthesis}
                  </p>
               </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Info className="h-5 w-5 text-accent" /> Synoptic Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground space-y-3">
                <p>The Synoptic accounts (Matthew, Mark, Luke) share a common structure, while John often provides a unique theological perspective.</p>
                <p>This tool identifies semantic overlaps and highlights how each evangelist emphasizes different aspects of the same historical event.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/10">
            <Layers className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">Map the Gospel Narratives</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">Align synoptic accounts to analyze synoptic relationships and theological nuances.</p>
          </div>
        )
      )}
    </div>
  );
});
