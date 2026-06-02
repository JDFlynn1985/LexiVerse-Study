'use client';

import React, { memo } from 'react';
import { Sparkles, Search, Loader2, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { ViewMode } from '@/types/scholarly';

interface AssistantViewProps {
  assistantTerm: string;
  setAssistantTerm: (term: string) => void;
  handleSearch: (term: string, type: ViewMode) => void;
  isLoading: boolean;
  assistantResult: AiStudyAssistantOutput | null;
}

export const AssistantView = memo(({ 
  assistantTerm, 
  setAssistantTerm, 
  handleSearch, 
  isLoading, 
  assistantResult 
}: AssistantViewProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" /> AI Study Assistant
      </h1>
      <p className="text-muted-foreground">Comprehensive research synthesis from scriptures and uploaded context.</p>
    </header>

    <div className="flex gap-4">
      <Input 
        placeholder="Enter a research topic or reference..." 
        className="h-12 shadow-sm"
        value={assistantTerm}
        onChange={e => setAssistantTerm(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')}
      />
      <Button size="lg" onClick={() => handleSearch(assistantTerm, 'ai-assistant')} disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
      </Button>
    </div>

    {assistantResult && (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="text-3xl font-headline mb-1">{assistantResult.originalWord}</CardTitle>
              <CardDescription className="text-lg">{assistantResult.transliteration} | {assistantResult.pronunciation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">{assistantResult.aiInsights}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg font-headline">Cited Verses</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {assistantResult.verseUsages.map((v: any, i: number) => (
                <Link key={i} href={v.url} target="_blank" className="flex items-center justify-between text-xs p-3 bg-muted/50 rounded-lg border group hover:border-primary/40">
                  <span className="font-medium text-primary">{v.text}</span>
                  <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )}
  </div>
));
