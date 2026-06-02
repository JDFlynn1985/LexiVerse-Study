'use client';

import React, { memo } from 'react';
import { BookOpen, Search, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DefineAndAnalyzeTermOutput } from '@/ai/flows/define-and-analyze-greek-hebrew-term';
import { ViewMode } from '@/types/scholarly';

interface LexiconViewProps {
  handleSearch: (term: string, type: ViewMode) => void;
  isLoading: boolean;
  lexiconResult: DefineAndAnalyzeTermOutput | null;
}

export const LexiconView = memo(({ handleSearch, isLoading, lexiconResult }: LexiconViewProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" /> Lexicon Explorer
      </h1>
      <p className="text-muted-foreground">In-depth original language analysis using Strong's concordance data.</p>
    </header>

    <div className="flex gap-4">
      <Input 
        placeholder="Enter Strong's Number (e.g. G3056)..." 
        className="h-12 shadow-sm" 
        onKeyDown={e => e.key === 'Enter' && handleSearch(e.currentTarget.value, 'lexicon')} 
      />
      <Button 
        size="lg" 
        onClick={() => { const el = document.querySelector('input[placeholder*="Strong"]') as HTMLInputElement; if (el) handleSearch(el.value, 'lexicon'); }} 
        disabled={isLoading}
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
                <CardDescription className="text-lg">{lexiconResult.transliteration} | {lexiconResult.pronunciation}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg py-1 px-4">{lexiconResult.searchStrongNumber}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{lexiconResult.definition}</p>
              <Separator />
              <p className="text-sm leading-relaxed text-muted-foreground">{lexiconResult.summary}</p>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {lexiconResult.verseOccurrences.map((v: any, i: number) => (
              <div key={i} className="p-4 bg-muted/30 rounded-xl border group hover:border-primary/40 transition-all">
                <p className="font-bold text-primary mb-2">{v.reference}</p>
                <p className="text-sm italic leading-relaxed">"{v.text}"</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader><CardTitle className="text-lg font-headline">Bibliography</CardTitle></CardHeader>
            <CardContent>
              <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap opacity-80">{lexiconResult.bibliography}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )}
  </div>
));
