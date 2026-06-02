'use client';

import React, { memo } from 'react';
import { Feather, Sparkles, ShieldCheck, ListFilter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';

interface SynthesisViewProps {
  synthesisText: string;
  setSynthesisText: (text: string) => void;
  handleSynthesisAction: (action: 'refine' | 'integrity' | 'bib') => void;
  isLoading: boolean;
  synthesisResult: WritingAssistantOutput | null;
  integrityResult: AcademicIntegrityOutput | null;
  bibResult: FormatBibliographyOutput | null;
}

export const SynthesisView = memo(({ 
  synthesisText, 
  setSynthesisText, 
  handleSynthesisAction, 
  isLoading, 
  synthesisResult, 
  integrityResult, 
  bibResult 
}: SynthesisViewProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header>
      <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
        <Feather className="h-8 w-8 text-primary" /> Academic Synthesis Hub
      </h1>
      <p className="text-muted-foreground">Refine your research, check integrity, and format bibliographies.</p>
    </header>

    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <Label className="text-lg font-bold">Research Draft</Label>
        <Textarea 
          placeholder="Paste your draft or raw source list here..." 
          className="min-h-[400px] text-lg font-body leading-relaxed shadow-inner"
          value={synthesisText}
          onChange={e => setSynthesisText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSynthesisAction('refine')} disabled={isLoading || !synthesisText.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Refine Tone
          </Button>
          <Button variant="secondary" onClick={() => handleSynthesisAction('integrity')} disabled={isLoading || !synthesisText.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Integrity Scan
          </Button>
          <Button variant="outline" onClick={() => handleSynthesisAction('bib')} disabled={isLoading || !synthesisText.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListFilter className="mr-2 h-4 w-4" />} Format Bib
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="results">Refined Text</TabsTrigger>
            <TabsTrigger value="integrity">Integrity Report</TabsTrigger>
            <TabsTrigger value="bib">Bibliography</TabsTrigger>
          </TabsList>
          <TabsContent value="results" className="mt-4">
            <Card className="min-h-[400px]">
              <CardContent className="pt-6">
                {synthesisResult ? (
                  <div className="space-y-6">
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{synthesisResult.improvedText}</p>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs uppercase text-primary">Corrections Made</h4>
                      <div className="grid gap-2">
                        {synthesisResult.corrections.map((c: any, i: number) => (
                          <div key={i} className="text-xs p-2 bg-muted rounded border-l-4 border-primary">
                            <span className="line-through text-muted-foreground">{c.original}</span> → <span className="font-bold">{c.replacement}</span>
                            <p className="mt-1 italic opacity-70">{c.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                    <Sparkles className="h-10 w-10 mb-2 opacity-20" />
                    <p>Select 'Refine Tone' to see AI improvements.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integrity" className="mt-4">
            <Card className="min-h-[400px]">
              <CardContent className="pt-6">
                {integrityResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-headline text-lg">Integrity Score</h3>
                      <Badge className={cn(integrityResult.integrityScore > 80 ? "bg-green-600" : "bg-orange-600")}>
                        {integrityResult.integrityScore}/100
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      {integrityResult.findings.map((f: any, i: number) => (
                        <div key={i} className="p-4 bg-muted/50 rounded-lg border-l-4 border-accent space-y-2">
                          <p className="text-sm font-medium">"{f.problematicText}"</p>
                          <p className="text-[11px] font-bold uppercase text-accent mt-1">Citation Suggestion</p>
                          <code className="text-[11px] block mt-1 bg-background p-2 rounded border font-mono">{f.citationSuggestion}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                    <ShieldCheck className="h-10 w-10 mb-2 opacity-20" />
                    <p>Run 'Integrity Scan' to identify missing citations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bib" className="mt-4">
             <Card className="min-h-[400px]">
              <CardContent className="pt-6">
                {bibResult ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg border font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                      {bibResult.formattedOutput}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                    <ListFilter className="h-10 w-10 mb-2 opacity-20" />
                    <p>Provide source names and click 'Format Bib'.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
));
