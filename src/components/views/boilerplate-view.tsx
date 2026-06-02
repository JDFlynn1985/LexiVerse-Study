'use client';

import React, { memo, useState } from 'react';
import { Puzzle, Search, Loader2, BookOpen, ListChecks, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BoilerplateOutput } from '@/ai/flows/boilerplate-flow';

interface BoilerplateViewProps {
  isLoading: boolean;
  result: BoilerplateOutput | null;
  onSearch: (term: string) => void;
}

/**
 * BoilerplateView - A template for new research modules.
 * Uses React.memo to ensure re-renders only occur when props change.
 */
export const BoilerplateView = memo(({ isLoading, result, onSearch }: BoilerplateViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Puzzle className="h-8 w-8 text-primary" /> Boilerplate Research Tool
        </h1>
        <p className="text-muted-foreground">Template for developing new scholarly modules and AI flows.</p>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Enter research topic..." 
            className="h-12 pl-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button size="lg" onClick={() => onSearch(searchTerm)} disabled={isLoading || !searchTerm.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Run Analysis
        </Button>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {result.summary}
                </p>
                
                <Separator />
                
                <div>
                  <h4 className="font-bold text-sm uppercase text-primary mb-3 flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Key Findings
                  </h4>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="mt-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center shrink-0">
                          {i + 1}
                        </Badge>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Theological Nuance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  {result.theologicalNuance}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-headline">Suggested Sources</CardTitle>
                <CardDescription>Academic references for further study.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.sources.map((source, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg border text-[11px] font-mono leading-snug">
                      {source}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full text-xs" onClick={() => window.print()}>
                  Export to Research Log
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-24 bg-muted/30 rounded-[2rem] border-2 border-dashed border-primary/10">
            <Puzzle className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">Ready for Development</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
              "Every great tool begins with a clean template."
            </p>
          </div>
        )
      )}
    </div>
  );
});
