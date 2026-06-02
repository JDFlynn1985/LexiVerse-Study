
'use client';

/**
 * @fileOverview Interactive Verse Explorer View.
 * Provides deep exegesis and passage-specific dialogue with the AI.
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import { NotebookPen, Search, Loader2, Sparkles, BookOpen, Send, MessageSquare, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { interactiveVerseExplorationAI, type InteractiveVerseExplorationAIOutput } from '@/ai/flows/interactive-verse-exploration-ai';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

interface VerseExplorerViewProps {
  isLoading: boolean;
}

export const VerseExplorerView = memo(({ isLoading: globalLoading }: VerseExplorerViewProps) => {
  const { t } = useLanguage();
  const [passage, setPassage] = useState('');
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  const handleExplore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passage.trim() || !question.trim()) return;

    const userMsg = question.trim();
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuestion('');
    setLocalLoading(true);

    try {
      const result = await interactiveVerseExplorationAI({
        term: passage,
        question: userMsg,
        history: history,
        model: 'googleai/gemini-2.5-flash'
      });

      setHistory(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (error: any) {
      setHistory(prev => [...prev, { role: 'model', content: "Error: The research engine encountered an issue processing this passage query." }]);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
               <NotebookPen className="h-6 w-6 text-primary" />
            </div>
            Verse Explorer
          </h1>
          <p className="text-muted-foreground">Interactive passage analysis and exegesis.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-4 flex-1 overflow-hidden">
        <Card className="lg:col-span-1 shadow-md border-primary/10 flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Focus Passage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase opacity-50">Reference</label>
              <Input 
                placeholder="e.g. John 1:1" 
                value={passage} 
                onChange={e => setPassage(e.target.value)} 
                className="bg-muted/30"
              />
            </div>
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                "Specify a verse to ground the AI in a specific scriptural context for your questions."
              </p>
            </div>
          </CardContent>
          <div className="mt-auto p-4 border-t bg-muted/10">
             <h4 className="text-[10px] font-bold uppercase mb-2 opacity-50">Quick Reference</h4>
             <div className="flex flex-wrap gap-1">
               {['Romans 8:1', 'Psalm 23', 'John 3:16'].map(v => (
                 <Badge key={v} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-[9px]" onClick={() => setPassage(v)}>
                   {v}
                 </Badge>
               ))}
             </div>
          </div>
        </Card>

        <Card className="lg:col-span-3 shadow-xl border-primary/10 flex flex-col h-full bg-card/30 backdrop-blur-sm overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {history.length === 0 && (
                <div className="py-20 text-center space-y-6 opacity-30">
                  <div className="p-6 bg-primary/5 rounded-full w-fit mx-auto">
                    <MessageSquare className="h-16 w-16 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-headline font-bold">Initiate Exegesis</h3>
                    <p className="text-sm italic max-w-sm mx-auto">Enter a passage and ask your first question to begin the interactive study session.</p>
                  </div>
                </div>
              )}
              {history.map((msg, i) => (
                <div key={i} className={cn("flex gap-4 group animate-in slide-in-from-bottom-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className={cn("h-8 w-8 shrink-0 border", msg.role === 'user' ? "border-primary/20" : "border-accent/20")}>
                    <AvatarFallback className={msg.role === 'user' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}>
                      {msg.role === 'user' ? 'S' : <NotebookPen className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[85%] space-y-1", msg.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none border-primary" 
                        : "bg-background rounded-tl-none border-border font-serif text-base"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {localLoading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="h-12 w-2/3 rounded-2xl bg-muted" />
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <CardFooter className="p-4 border-t bg-muted/30">
            <form onSubmit={handleExplore} className="flex gap-2 w-full">
              <Input 
                placeholder="Ask about the theological weight of this passage..." 
                className="h-12 rounded-xl border-primary/20 bg-background shadow-inner"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                disabled={localLoading || !passage.trim()}
              />
              <Button type="submit" disabled={localLoading || !passage.trim() || !question.trim()} className="h-12 px-6 rounded-xl shadow-lg">
                {localLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
});
