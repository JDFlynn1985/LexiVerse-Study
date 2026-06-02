
'use client';

import React, { memo } from 'react';
import { Sparkles, Search, Loader2, ExternalLink, Download, Save, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { AiStudyAssistantOutput } from '@/ai/flows/ai-study-assistant';
import { ViewMode } from '@/types/scholarly';
import { Separator } from '@/components/ui/separator';

interface AssistantViewProps {
  assistantTerm: string;
  setAssistantTerm: (term: string) => void;
  handleSearch: (term: string, type: ViewMode) => void;
  handleSaveSession: (title: string, type: string, data: any) => void;
  handleExport: (format: 'pdf' | 'docx' | 'markdown' | 'txt', data: any) => void;
  isLoading: boolean;
  assistantResult: AiStudyAssistantOutput | null;
  isUserSignedIn: boolean;
}

export const AssistantView = memo(({ 
  assistantTerm, 
  setAssistantTerm, 
  handleSearch, 
  handleSaveSession,
  handleExport,
  isLoading, 
  assistantResult,
  isUserSignedIn
}: AssistantViewProps) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" /> AI Study Assistant
          </h1>
          <p className="text-muted-foreground">Comprehensive research synthesis from scriptures and uploaded context.</p>
        </div>
        {assistantResult && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSaveSession(assistantResult.originalWord, 'assistant', assistantResult)}
              disabled={!isUserSignedIn}
              className="h-9 gap-2"
            >
              <Save className="h-4 w-4" /> Save to Workspace
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9 gap-2">
                  <Download className="h-4 w-4" /> Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('pdf', assistantResult)}>
                  <FileText className="h-4 w-4 mr-2" /> Portable Document (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx', assistantResult)}>
                  <FileText className="h-4 w-4 mr-2" /> MS Word (DOCX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('markdown', assistantResult)}>
                  <FileText className="h-4 w-4 mr-2" /> Markdown (MD)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('txt', assistantResult)}>
                  <FileText className="h-4 w-4 mr-2" /> Plain Text (TXT)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
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
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-2 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="text-4xl font-headline mb-1">{assistantResult.originalWord}</CardTitle>
                <CardDescription className="text-lg">
                  <span className="font-mono">{assistantResult.transliteration}</span> | {assistantResult.pronunciation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h4 className="font-bold text-sm uppercase text-primary mb-4">Lexical Definitions</h4>
                  <div className="grid gap-2">
                    {assistantResult.definitions.map((d, i) => (
                      <p key={i} className="text-sm leading-relaxed p-3 bg-muted/30 rounded-lg border">
                        {d}
                      </p>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-bold text-sm uppercase text-primary mb-4">Scholarly Synthesis</h4>
                  <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap font-serif">
                    {assistantResult.aiInsights}
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-bold text-sm uppercase text-primary mb-4">Historical Commentary</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic bg-muted/10 p-4 rounded-xl border border-dashed">
                    {assistantResult.commentaryInsights}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 border-t">
                <div className="w-full">
                  <h4 className="font-bold text-[10px] uppercase text-muted-foreground mb-2">Sources Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {assistantResult.bibliography.map((b, i) => (
                      <Link key={i} href={b.url} target="_blank" className="text-[10px] font-mono text-primary hover:underline bg-background px-2 py-1 rounded border">
                        {b.text}
                      </Link>
                    ))}
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-headline">Cited Passages</CardTitle>
                <CardDescription>Primary scriptural anchors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assistantResult.verseUsages.map((v, i) => (
                  <Link 
                    key={i} 
                    href={v.url} 
                    target="_blank" 
                    className="flex items-center justify-between text-xs p-3 bg-muted/50 rounded-lg border group hover:border-primary/40 hover:bg-background transition-all"
                  >
                    <span className="font-bold text-primary">{v.text}</span>
                    <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">Translational Variations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 {assistantResult.translationVariations.map((tv, i) => (
                   <p key={i} className="text-xs text-muted-foreground leading-relaxed border-b pb-2 last:border-none last:pb-0">
                     {tv}
                   </p>
                 ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});
