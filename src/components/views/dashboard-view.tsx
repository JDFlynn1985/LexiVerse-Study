'use client';

import React, { memo } from 'react';
import { Sparkles, GraduationCap, Clock, ArrowRight, History, FileSearch2, Feather, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickToolCard } from './quick-tool-card';
import { ViewMode } from '@/types/scholarly';

interface DashboardViewProps {
  t: any;
  effectiveApiKey: string | undefined;
  isLocalMode: boolean;
  aiPrefs: any;
  assistantTerm: string;
  setAssistantTerm: (term: string) => void;
  handleSearch: (term: string, type: ViewMode) => void;
  isLoading: boolean;
  historyItems: any[];
  setActiveTab: (tab: ViewMode) => void;
}

export const DashboardView = memo(({ 
  t, 
  effectiveApiKey, 
  isLocalMode, 
  aiPrefs, 
  assistantTerm, 
  setAssistantTerm, 
  handleSearch, 
  isLoading, 
  historyItems, 
  setActiveTab 
}: DashboardViewProps) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.dashboard.title}</h1>
          <p className="text-muted-foreground text-lg">{t.dashboard.subtitle}</p>
        </div>
      </div>
    </header>

    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2 shadow-xl border-primary/10 bg-card/50 overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Sparkles className="h-24 w-24 text-primary" />
        </div>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2 text-2xl">
            <Sparkles className={cn("h-6 w-6", effectiveApiKey || isLocalMode ? "text-primary" : "text-muted-foreground")} /> 
            {isLocalMode ? `Local AI Engine (${aiPrefs.selectedModel})` : "Global AI Engine (Gemini)"}
          </CardTitle>
          <CardDescription>Synthesize deep theological insights from your digital library.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Input 
              placeholder={effectiveApiKey || isLocalMode ? "e.g. Analyze eschatological fragments in Hebrews..." : "AI Engine Configuration Needed"} 
              className="h-14 pl-4 pr-16 text-lg rounded-xl shadow-inner border-primary/20 focus:ring-primary/30"
              value={assistantTerm} 
              onChange={e => setAssistantTerm(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')} 
            />
            <Button 
              className="absolute right-2 top-2 h-10 w-10 rounded-lg"
              onClick={() => handleSearch(assistantTerm, 'ai-assistant')} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Justification', 'Logos', 'Sola Scriptura', 'Sanctification'].map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1" onClick={() => { setAssistantTerm(tag); handleSearch(tag, 'ai-assistant'); }}>
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-accent/20 bg-accent/5 flex flex-col justify-between">
        <CardHeader>
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyItems.length > 0 ? historyItems.slice(0, 5).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-background/50 rounded-lg border group cursor-pointer hover:border-primary/40" onClick={() => handleSearch(item.term, item.type as any)}>
              <span className="font-medium truncate max-w-[120px]">{item.term}</span>
              <span className="text-[10px] text-muted-foreground">{item.type}</span>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">No recent research logged.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('profile')}>View All History</Button>
        </CardFooter>
      </Card>
    </div>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <QuickToolCard 
        title="Manuscript Hub" 
        desc="OCR fragment transcription" 
        icon={<FileSearch2 className="h-6 w-6" />} 
        asLink="/manuscripts"
      />
      <QuickToolCard 
        title="Theology Map" 
        desc="Historical concept analysis" 
        icon={<History className="h-6 w-6" />} 
        onClick={() => setActiveTab('theology')} 
      />
      <QuickToolCard 
        title="Writing Hub" 
        desc="Synthesis & integrity" 
        icon={<Feather className="h-6 w-6" />} 
        onClick={() => setActiveTab('synthesis')} 
      />
      <QuickToolCard 
        title="Chat Hub" 
        desc="Real-time scholarly dialogue" 
        icon={<MessageSquare className="h-6 w-6" />} 
        onClick={() => setActiveTab('chat')} 
      />
    </div>
  </div>
));
