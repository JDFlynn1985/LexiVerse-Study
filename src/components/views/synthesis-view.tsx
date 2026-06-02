'use client';

import React, { memo } from 'react';
import { Feather, Sparkles, ShieldCheck, ListFilter, Loader2, Link as LinkIcon, Save, Download, FileText, CheckCircle2, Database, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WritingAssistantOutput } from '@/ai/flows/writing-assistant-ai';
import { AcademicIntegrityOutput } from '@/ai/flows/academic-integrity-ai';
import { FormatBibliographyOutput } from '@/ai/flows/format-bibliography-ai';
import { CovertReferenceOutput } from '@/ai/flows/cross-reference-ai';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface SynthesisViewProps {
  synthesisText: string;
  setSynthesisText: (text: string) => void;
  handleSynthesisAction: (action: 'refine' | 'integrity' | 'bib' | 'cross-ref') => void;
  handleSaveDraftToLibrary: (name: string, content: string) => void;
  handleExportText: (format: 'pdf' | 'docx' | 'markdown' | 'txt' | 'bibtex' | 'gdrive' | 'gdocs', title: string, text: string) => void;
  isLoading: boolean;
  synthesisResult: WritingAssistantOutput | null;
  integrityResult: AcademicIntegrityOutput | null;
  bibResult: FormatBibliographyOutput | null;
  crossRefResult: CovertReferenceOutput | null;
  isGrounded?: boolean;
}

export const SynthesisView = memo(({ 
  synthesisText, 
  setSynthesisText, 
  handleSynthesisAction, 
  handleSaveDraftToLibrary,
  handleExportText,
  isLoading, 
  synthesisResult, 
  integrityResult, 
  bibResult,
  crossRefResult,
  isGrounded
}: SynthesisViewProps) => {
  const currentText = synthesisResult?.improvedText || synthesisText;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Feather className="h-8 w-8 text-primary" /> Writing Hub
          </h1>
          <p className="text-muted-foreground">Refine research, audit integrity, and identify semantic scripture links.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSaveDraftToLibrary('Refined Research Draft', currentText)}
            className="h-9"
          >
            <Save className="h-4 w-4 mr-2" /> Save to Library
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-9">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Scholarly Formats</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportText('pdf', 'Research Draft', currentText)}>
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportText('docx', 'Research Draft', currentText)}>
                MS Word
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportText('bibtex', 'Research Draft', bibResult?.formattedOutput || currentText)}>
                BibTeX (Zotero)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Google Workspace</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExportText('gdrive', 'Research Draft', currentText)}>
                <Database className="h-4 w-4 mr-2 text-primary" /> Save to Drive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportText('gdocs', 'Research Draft', currentText)}>
                <FileText className="h-4 w-4 mr-2 text-primary" /> Create Google Doc
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-bold">Research Draft</Label>
            {isGrounded && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 py-1 px-3">
                <CheckCircle2 className="h-3 w-3" /> Library Grounding Active
              </Badge>
            )}
          </div>
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
            <Button variant="outline" onClick={() => handleSynthesisAction('cross-ref')} disabled={isLoading || !synthesisText.trim()}>
               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />} Cross-Ref Scan
            </Button>
          </div>
        </div>
        <div className="space-y-6">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="results">Refined</TabsTrigger>
              <TabsTrigger value="integrity">Integrity</TabsTrigger>
              <TabsTrigger value="cross-ref">Links</TabsTrigger>
              <TabsTrigger value="bib">Bib</TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="mt-4">
              <Card className="min-h-[400px] flex flex-col">
                <CardContent className="pt-6 flex-1">
                  {synthesisResult ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg border">
                         <div className="flex items-center gap-2">
                           <Sparkles className="h-4 w-4 text-primary" />
                           <span className="text-xs font-bold uppercase tracking-widest">Academic Refinement Ready</span>
                         </div>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-7 text-[10px] gap-1 bg-background"
                           onClick={() => setSynthesisText(synthesisResult.improvedText)}
                         >
                           Apply Changes <ChevronRight className="h-3 w-3" />
                         </Button>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-sm font-serif italic text-foreground/70">{synthesisResult.improvedText}</p>
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
                        <Badge className={integrityResult.integrityScore > 80 ? "bg-green-600" : "bg-orange-600"}>
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
            <TabsContent value="cross-ref" className="mt-4">
               <Card className="min-h-[400px]">
                <CardContent className="pt-6">
                  {crossRefResult ? (
                    <div className="space-y-6">
                      <h3 className="font-headline text-lg flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Semantic Links Detected</h3>
                      <div className="space-y-4">
                        {crossRefResult.covertLinks.map((link, i) => (
                          <div key={i} className="p-4 bg-muted/30 rounded-lg border border-primary/10 space-y-2">
                             <div className="flex justify-between items-start">
                               <p className="text-xs italic text-muted-foreground">"...{link.sourceFragment}..."</p>
                               <Badge variant="secondary" className="text-[10px] shrink-0">{link.suggestedScripture}</Badge>
                             </div>
                             <p className="text-[11px] leading-relaxed"><strong>Theological Basis:</strong> {link.theologicalBasis}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic">
                      <LinkIcon className="h-10 w-10 mb-2 opacity-20" />
                      <p>Run 'Cross-Ref Scan' to find semantic scripture links.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bib" className="mt-4">
               <Card className="min-h-[400px]">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => handleSynthesisAction('bib')} disabled={isLoading || !synthesisText.trim()}>
                       <ListFilter className="h-4 w-4" /> Generate SBL Bibliography
                    </Button>
                    {bibResult ? (
                      <div className="p-4 bg-muted/50 rounded-lg border font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                        {bibResult.formattedOutput}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground italic opacity-50">
                        <ListFilter className="h-10 w-10 mb-2" />
                        <p className="text-center text-xs">Enter source list in the draft area and generate.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
});
