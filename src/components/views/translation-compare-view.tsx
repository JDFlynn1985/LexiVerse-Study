/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 *
 * This work is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 
 * International License. To view a copy of this license, visit:
 * http://creativecommons.org
 *
 * @fileOverview Grounded Translation Comparison View for scholarly passage and word analysis.
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { ArrowLeftRight, Search, Loader2, Info, BookOpen, Layers, Languages, Type } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompareTranslationsOutput } from '@/ai/flows/compare-translations-ai';
import { BibleVersion, getVerseText, isReference } from '@/lib/bible-api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TranslationCompareViewProps {
  isLoading: boolean;
  result: CompareTranslationsOutput | null;
  availableVersions: BibleVersion[];
  onCompare: (word: string, language: string, versions: string[], groundedTexts?: Record<string, string>) => void;
}

export const TranslationCompareView = memo(({ 
  isLoading, 
  result, 
  availableVersions, 
  onCompare 
}: TranslationCompareViewProps) => {
  const { toast } = useToast();
  const [word, setWord] = useState('');
  const [lang, setLang] = useState('Greek');
  const [mode, setMode] = useState<'word' | 'passage'>('word');
  const [selectedVersions, setSelectedVersions] = useState<string[]>(['KJV', 'NIV', 'ESV']);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // Auto-detect mode based on input
    if (isReference(word)) {
      setMode('passage');
    } else if (word.trim()) {
      setMode('word');
    }
  }, [word]);

  const toggleVersion = (id: string) => {
    setSelectedVersions(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (!word.trim() || selectedVersions.length < 2) return;

    let grounded: Record<string, string> = {};
    
    if (mode === 'passage') {
      setIsFetching(true);
      try {
        const fetchPromises = selectedVersions.map(async (v) => {
          const text = await getVerseText(v.toLowerCase(), word);
          return { v, text };
        });
        const texts = await Promise.all(fetchPromises);
        texts.forEach(item => {
          if (item.text) grounded[item.v] = item.text;
        });

        if (Object.keys(grounded).length === 0) {
          toast({ variant: 'destructive', title: "Reference Not Found", description: "Could not fetch passage text for comparison." });
          setIsFetching(false);
          return;
        }
      } catch (e) {
        console.error("Grounded fetch failed", e);
      } finally {
        setIsFetching(false);
      }
    }

    onCompare(word, lang, selectedVersions, mode === 'passage' ? grounded : undefined);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 text-primary" /> Translation Comparison
          </h1>
          <p className="text-muted-foreground">Analyze nuances between linguistic renderings and synoptic traditions.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg">
          <Button 
            variant={mode === 'word' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setMode('word')}
            className="gap-2"
          >
            <Type className="h-4 w-4" /> Word
          </Button>
          <Button 
            variant={mode === 'passage' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setMode('passage')}
            className="gap-2"
          >
            <Languages className="h-4 w-4" /> Passage
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 shadow-md border-primary/10 h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{mode === 'word' ? 'Scholarly Term' : 'Bible Reference'}</Label>
              <Input 
                placeholder={mode === 'word' ? "e.g. Logos" : "e.g. John 1:1"} 
                value={word} 
                onChange={e => setWord(e.target.value)} 
              />
            </div>
            
            {mode === 'word' && (
              <div className="space-y-2">
                <Label>Source Language</Label>
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Greek">Greek</SelectItem>
                    <SelectItem value="Hebrew">Hebrew</SelectItem>
                    <SelectItem value="Aramaic">Aramaic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label className="flex justify-between">
                <span>Select Versions</span>
                <span className="text-[10px] text-primary">{selectedVersions.length} selected</span>
              </Label>
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {availableVersions.map(v => (
                  <div key={v.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`ver-${v.id}`} 
                      checked={selectedVersions.includes(v.id.toUpperCase())}
                      onCheckedChange={() => toggleVersion(v.id.toUpperCase())}
                    />
                    <label htmlFor={`ver-${v.id}`} className="text-xs font-medium cursor-pointer leading-none">
                      {v.id.toUpperCase()} <span className="text-[10px] text-muted-foreground opacity-50">({v.language})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleCompare} disabled={isLoading || isFetching || !word.trim() || selectedVersions.length < 2}>
              {isLoading || isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Layers className="mr-2 h-4 w-4" />}
              Compare Traditions
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <Card className="shadow-lg border-primary/10 overflow-hidden">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-4xl font-headline mb-1">{result.originalWord}</CardTitle>
                      <CardDescription className="text-lg font-medium">{result.language} Analysis</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/20">{result.versionsCompared.length} Versions</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    {result.translations.map((t, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-xl border border-primary/5 hover:border-primary/20 transition-all flex flex-col justify-between">
                        <div>
                          <Badge variant="secondary" className="mb-2 text-[10px] uppercase font-bold">{t.version}</Badge>
                          <p className="text-lg font-bold text-primary mb-2">"{t.translation}"</p>
                          {t.notes && <p className="text-[10px] italic text-muted-foreground leading-relaxed">{t.notes}</p>}
                        </div>
                        {t.transliteration && (
                          <div className="mt-4 pt-2 border-t text-[10px] text-muted-foreground font-mono">
                            {t.transliteration} | {t.pronunciation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase text-primary flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> AI Comparative Exegesis
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground/80 bg-background p-4 rounded-lg border italic shadow-inner whitespace-pre-wrap">
                      {result.summary}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-4">
                  <div className="space-y-2 w-full">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Scholarly References</p>
                    <p className="text-[11px] font-mono opacity-60 truncate">{result.bibliography}</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            !isLoading && !isFetching && (
              <div className="text-center py-40 bg-muted/20 rounded-[3rem] border-2 border-dashed border-primary/10">
                <ArrowLeftRight className="h-20 w-20 mx-auto mb-4 text-primary opacity-5" />
                <h3 className="text-2xl font-headline font-bold text-muted-foreground">Grounded Comparative Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
                  Analyze differences in translation philosophy using live primary sources.
                </p>
              </div>
            )
          )}

          {(isLoading || isFetching) && (
            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-headline text-lg italic">
                {isFetching ? "Fetching Source Traditions..." : "Synthesizing Translational Nuances..."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
