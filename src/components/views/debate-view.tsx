
'use client';

/**
 * @fileOverview Scholarly Dialogues (Theological Debate Simulator) View.
 */

import React, { memo, useState } from 'react';
import { Users, Search, Loader2, Sparkles, BookOpen, Quote, MessageSquareQuote, History, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { runScholarlyDebate, type DebateOutput } from '@/ai/flows/debate-simulator-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const DebateView = memo(() => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [figureA, setFigureA] = useState('Augustine');
  const [figureB, setFigureB] = useState('Pelagius');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebateOutput | null>(null);

  const handleSimulate = async () => {
    if (!topic.trim() || !figureA.trim() || !figureB.trim()) return;
    setIsLoading(true);
    try {
      const data = await runScholarlyDebate({ topic, figureA, figureB });
      setResult(data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Simulation Failed", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" /> Scholarly Dialogues
        </h1>
        <p className="text-muted-foreground">Simulate historical theological debates and dialetic developments.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase opacity-50 px-1">First Figure</label>
          <Input placeholder="e.g. Augustine" value={figureA} onChange={e => setFigureA(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase opacity-50 px-1">Second Figure</label>
          <Input placeholder="e.g. Pelagius" value={figureB} onChange={e => setFigureB(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase opacity-50 px-1">Debate Topic</label>
          <div className="flex gap-2">
            <Input placeholder="e.g. Free Will" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSimulate()} />
            <Button onClick={handleSimulate} disabled={isLoading || !topic.trim()}>
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden bg-card/50">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{result.title}</CardTitle>
                <CardDescription className="italic">{result.openingContext}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  {result.dialogue.map((turn, i) => (
                    <div key={i} className={cn("flex flex-col gap-2 p-5 rounded-2xl border transition-all", i % 2 === 0 ? "bg-muted/30 border-primary/5 mr-12" : "bg-background border-accent/10 ml-12")}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">{turn.speaker}</span>
                        <Quote className="h-3 w-3 opacity-20" />
                      </div>
                      <p className="text-sm leading-relaxed italic text-foreground/80">"{turn.content}"</p>
                      <div className="pt-2 border-t mt-2 flex justify-end">
                        <code className="text-[9px] font-mono text-muted-foreground">{turn.citation}</code>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-4 flex items-center gap-2">
                    <History className="h-4 w-4" /> Academic Synthesis
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap bg-muted/20 p-6 rounded-xl border-2 border-dashed">
                    {result.scholarlySynthesis}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" /> Source Bibliography
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.bibliography.map((b, i) => (
                    <p key={i} className="text-[10px] font-mono leading-tight text-muted-foreground">{b}</p>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                 <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase" onClick={() => window.print()}>
                   Save Dialogue Transcript
                 </Button>
              </CardFooter>
            </Card>

            <Card>
               <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                   <Info className="h-4 w-4 text-primary" /> Dialectical Method
                 </CardTitle>
               </CardHeader>
               <CardContent className="text-xs text-muted-foreground leading-relaxed">
                 Scholarly dialogues are simulated based on the historical writings and theological systems of the chosen figures. While AI-generated, they provide a structural overview of diverging traditions.
               </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-24 bg-muted/30 rounded-[3rem] border-2 border-dashed border-primary/10">
            <Users className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">The Great Conversation</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
              "As iron sharpens iron, so one person sharpens another." Enter a topic to see historical minds meet.
            </p>
          </div>
        )
      )}
    </div>
  );
});
