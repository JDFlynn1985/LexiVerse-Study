'use client';

import React, { memo, useState } from 'react';
import { ListFilter, Search, Loader2, BookOpen, ListChecks, Sparkles, Copy, Trash2, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { extractCitations, type ExtractionOutput } from '@/ai/flows/extract-citations-flow';
import { useToast } from '@/hooks/use-toast';

export const CitationScannerView = memo(() => {
  const { toast } = useToast();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractionOutput | null>(null);

  const handleScan = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const data = await extractCitations(inputText);
      setResult(data);
      toast({ title: "Citations Extracted", description: `Found ${data.citations.length} scholarly references.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Scanner Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBib = () => {
    if (!result) return;
    const bibText = result.citations.map(c => c.sblFormat).join('\n\n');
    navigator.clipboard.writeText(bibText);
    toast({ title: "Copied", description: "Bibliography copied to clipboard." });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <ListFilter className="h-8 w-8 text-primary" /> Bibliographic Scanner
        </h1>
        <p className="text-muted-foreground">Extract and structure SBL-compliant citations from your research drafts.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Textarea 
            placeholder="Paste text with raw citations here..." 
            className="min-h-[400px] shadow-inner"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="lg" onClick={handleScan} disabled={isLoading || !inputText.trim()} className="w-full shadow-lg">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Identify Scholarly References
            </Button>
            <Button variant="outline" size="lg" onClick={() => setInputText('')}>Reset</Button>
          </div>
        </div>

        <div className="space-y-6">
          {result ? (
            <Card className="min-h-[500px] shadow-xl border-primary/10 flex flex-col">
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Extracted Bibliography
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={copyBib} className="h-8 gap-2">
                    <Copy className="h-3 w-3" /> Copy All
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 pt-6 space-y-6">
                <div className="space-y-4">
                  {result.citations.map((cite, i) => (
                    <div key={i} className="p-4 bg-muted/30 rounded-lg border border-primary/5 group relative transition-all hover:border-primary/20">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-widest">{cite.sourceType}</Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">{cite.year}</span>
                      </div>
                      <p className="text-sm font-bold text-primary mb-1">{cite.title}</p>
                      <p className="text-xs text-muted-foreground mb-3">{cite.author}</p>
                      <code className="text-[10px] block p-2 bg-background rounded border font-mono italic">
                        {cite.sblFormat}
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-4">
                <p className="text-[10px] text-muted-foreground italic">
                  <strong>Note:</strong> Citations are extracted via AI analysis of the text. Always verify against institutional style guides.
                </p>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-primary/10">
              <FileText className="h-16 w-16 text-primary opacity-5 mb-4" />
              <h3 className="text-xl font-headline font-bold text-muted-foreground opacity-40">Ready to Scan</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 italic opacity-40">
                Paste your research draft to the left to structure your bibliography.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
