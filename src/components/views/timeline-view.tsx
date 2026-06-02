
'use client';

/**
 * @fileOverview Historical Context & Timeline Mapper View.
 */

import React, { memo, useState } from 'react';
import { Clock, Search, Loader2, Sparkles, BookOpen, Milestone, Landmark } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HistoricalTimelineOutput } from '@/ai/flows/historical-timeline-flow';
import { useLanguage } from '@/components/language-provider';
import { cn } from '@/lib/utils';

interface TimelineViewProps {
  isLoading: boolean;
  result: HistoricalTimelineOutput | null;
  onSearch: (topic: string) => void;
}

export const TimelineView = memo(({ isLoading, result, onSearch }: TimelineViewProps) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" /> {t.nav.timeline}
        </h1>
        <p className="text-muted-foreground">{t.timeline.description}</p>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t.timeline.placeholder} 
            className="h-12 pl-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button size="lg" onClick={() => onSearch(searchTerm)} disabled={isLoading || !searchTerm.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t.timeline.action}
        </Button>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{result.topic}</CardTitle>
                <CardDescription>{result.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10">
                <div className="relative border-l-2 border-primary/20 pl-8 ml-4 space-y-8">
                   {result.timeline.map((item, i) => (
                     <div key={i} className="relative">
                       <div className="absolute -left-[41px] top-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-4 border-background">
                         <Milestone className="h-3 w-3 text-primary-foreground" />
                       </div>
                       <div className="space-y-1">
                         <Badge variant="secondary" className="text-[10px] tracking-widest">{item.date}</Badge>
                         <h4 className="font-bold text-lg">{item.event}</h4>
                         <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                         <Badge variant="outline" className="text-[9px] uppercase font-bold opacity-60">
                           {item.sourceType} Verified
                         </Badge>
                       </div>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-accent" /> {t.timeline.sections.archaeology}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  {result.archaeologicalContext}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> {t.timeline.sections.analysis}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.scholarlyAnalysis}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed">
             <Clock className="h-16 w-16 mx-auto mb-4 text-primary opacity-5" />
             <p className="text-muted-foreground italic">Generate a historical timeline to visualize the biblical narrative in context.</p>
          </div>
        )
      )}
    </div>
  );
});
