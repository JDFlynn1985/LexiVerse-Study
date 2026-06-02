'use client';

import React, { memo } from 'react';
import { History, Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { ViewMode } from '@/types/scholarly';

interface TheologyViewProps {
  theologyTerm: string;
  setTheologyTerm: (term: string) => void;
  handleSearch: (term: string, type: ViewMode) => void;
  isLoading: boolean;
  theologyResult: TheologicalConceptOutput | null;
}

export const TheologyView = memo(({ 
  theologyTerm, 
  setTheologyTerm, 
  handleSearch, 
  isLoading, 
  theologyResult 
}: TheologyViewProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
        <History className="h-8 w-8 text-primary" /> Theological Concept Mapper
      </h1>
      <p className="text-muted-foreground">Deep analysis of systemic theological terms and historical development.</p>
    </header>

    <div className="flex gap-4">
      <Input 
        placeholder="Enter a concept (e.g. Atonement, Sovereignty, Trinity)..." 
        className="h-12 text-lg shadow-sm"
        value={theologyTerm}
        onChange={e => setTheologyTerm(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch(theologyTerm, 'theology')}
      />
      <Button size="lg" onClick={() => handleSearch(theologyTerm, 'theology')} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
      </Button>
    </div>

    {theologyResult ? (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{theologyResult.concept}</CardTitle>
              <CardDescription className="italic">{theologyResult.etymology}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-bold text-sm uppercase text-primary mb-2">Formal Definition</h4>
                <p className="text-lg leading-relaxed text-foreground/80">{theologyResult.definition}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-bold text-sm uppercase text-primary mb-4">Historical Development</h4>
                <div className="space-y-6 relative border-l-2 border-primary/20 pl-6 ml-2">
                  {theologyResult.historicalDevelopment.map((dev: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                      <h5 className="font-bold text-lg">{dev.period}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{dev.keyDevelopment}</p>
                      <div className="flex flex-wrap gap-1">
                        {dev.notableFigures.map((fig: string) => <Badge key={fig} variant="outline" className="text-[10px]">{fig}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-headline">Scriptural Anchors</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {theologyResult.keyVerses.map((v: any, i: number) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg border group cursor-pointer hover:border-primary/40">
                  <p className="font-bold text-primary text-sm flex items-center justify-between">{v.reference}</p>
                  <p className="text-xs text-muted-foreground mt-1">{v.significance}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    ) : (
      !isLoading && (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/10">
          <History className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
          <h3 className="text-xl font-headline font-bold text-muted-foreground">Start Your Theological Journey</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">Map the history of salvation and the development of Christian thought with AI assistance.</p>
        </div>
      )
    )}
  </div>
));
