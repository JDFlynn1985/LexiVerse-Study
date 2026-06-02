
'use client';

/**
 * @fileOverview Biblical Geography & Spatial Narrative View.
 */

import React, { memo, useState } from 'react';
import { Globe, Search, Loader2, BookOpen, MapPin, Sparkles, Navigation } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GeographyOutput, runGeographyAnalysis } from '@/ai/flows/geography-flow';
import { useLanguage } from '@/components/language-provider';

interface GeographyViewProps {
  isLoading: boolean;
  result: GeographyOutput | null;
  onSearch: (term: string) => void;
}

export const GeographyView = memo(({ isLoading, result, onSearch }: GeographyViewProps) => {
  const { t } = useLanguage();
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
          <Globe className="h-8 w-8 text-primary" /> {t.geography.title}
        </h1>
        <p className="text-muted-foreground">{t.geography.description}</p>
      </header>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder={t.geography.placeholder} 
            className="h-12 pl-10 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button size="lg" onClick={() => onSearch(searchTerm)} disabled={isLoading || !searchTerm.trim()}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {t.geography.action}
        </Button>
      </div>

      {result ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-primary/10 overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-primary" /> {t.geography.sections.summary}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {result.summary}
                </p>
                
                <Separator />
                
                <div>
                  <h4 className="font-bold text-sm uppercase text-primary mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {t.geography.sections.sites}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.sites.map((site, i) => (
                      <div key={i} className="p-4 bg-muted/30 rounded-xl border border-primary/5 space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-sm">{site.name}</h5>
                          <code className="text-[9px] bg-background px-1.5 py-0.5 rounded border opacity-60">{site.coordinates}</code>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{site.significance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline">{t.geography.sections.nuance}</CardTitle>
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
                <CardTitle className="text-lg font-headline">{t.geography.sections.sources}</CardTitle>
                <CardDescription>Cartographic and academic resources.</CardDescription>
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
                  Export to Map Log
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-24 bg-muted/30 rounded-[2rem] border-2 border-dashed border-primary/10">
            <Globe className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">{t.geography.empty_state}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">
              {t.geography.empty_sub}
            </p>
          </div>
        )
      )}
    </div>
  );
});
