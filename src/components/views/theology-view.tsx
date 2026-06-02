'use client';

import React, { memo } from 'react';
import { History, Search, Loader2, Sparkles, TrendingUp, User, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TheologicalConceptOutput } from '@/ai/flows/theological-concept-analysis';
import { ViewMode } from '@/types/scholarly';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

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
}: TheologyViewProps) => {

  const chartData = theologyResult?.historicalDevelopment.map((dev, idx) => ({
    period: dev.period,
    development: dev.keyDevelopment,
    figures: dev.notableFigures.length,
    index: idx + 1,
    label: dev.period.split(' ')[0]
  })) || [];

  return (
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
            <Card className="shadow-lg border-primary/10 bg-card overflow-hidden">
              <div className="h-1.5 bg-primary w-full" />
              <CardHeader className="pb-2">
                <CardTitle className="font-headline text-2xl">{theologyResult.concept}</CardTitle>
                <CardDescription className="italic">{theologyResult.etymology}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2">Formal Definition</h4>
                  <p className="text-lg leading-relaxed text-foreground/80 font-serif">{theologyResult.definition}</p>
                </div>
                
                <Separator />

                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase text-primary flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Development Density Map
                  </h4>
                  <div className="h-48 w-full bg-muted/20 rounded-xl border p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="index" hide />
                        <YAxis dataKey="figures" hide />
                        <ZAxis range={[50, 400]} />
                        <ChartTooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-xl max-w-[200px]">
                                  <p className="text-[10px] font-bold uppercase text-primary mb-1">{data.period}</p>
                                  <p className="text-[11px] italic leading-tight">"{data.development.substring(0, 80)}..."</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter data={chartData} fill="hsl(var(--primary))">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fillOpacity={0.6 + (index * 0.1)} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="flex justify-between px-2 text-[8px] font-bold text-muted-foreground uppercase mt-2">
                      <span>Patristic</span>
                      <span>Medieval</span>
                      <span>Reformation</span>
                      <span>Modern</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-4">Chronological Timeline</h4>
                  <div className="space-y-6 relative border-l-2 border-primary/20 pl-6 ml-2">
                    {theologyResult.historicalDevelopment.map((dev: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                        <h5 className="font-bold text-lg">{dev.period}</h5>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{dev.keyDevelopment}</p>
                        <div className="flex flex-wrap gap-1">
                          {dev.notableFigures.map((fig: string) => (
                            <Badge key={fig} variant="outline" className="text-[10px] gap-1 bg-background">
                              <User className="h-2 w-2" /> {fig}
                            </Badge>
                          ))}
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
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Scriptural Anchors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {theologyResult.keyVerses.map((v: any, i: number) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-xl border group cursor-pointer hover:border-primary/40 hover:bg-background transition-all">
                    <p className="font-bold text-primary text-sm flex items-center justify-between">
                      {v.reference}
                      <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed italic">{v.significance}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground shadow-xl">
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-widest opacity-70">Scholarly Synthesis</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm leading-relaxed font-serif">
                    {theologyResult.academicSynthesis}
                  </p>
                  <Separator className="my-4 bg-white/20" />
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase opacity-60">SBL Bibliography</p>
                    <p className="text-[10px] font-mono leading-tight opacity-80">{theologyResult.bibliography}</p>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-primary/10">
            <History className="h-16 w-16 mx-auto mb-4 text-primary opacity-10" />
            <h3 className="text-xl font-headline font-bold text-muted-foreground">Start Your Theological Journey</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2 italic">Map the history of salvation and the development of Christian thought with AI-powered synthesis.</p>
          </div>
        )
      )}
    </div>
  );
});