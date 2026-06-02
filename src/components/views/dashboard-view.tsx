'use client';

import React, { memo } from 'react';
import { Sparkles, GraduationCap, Clock, ArrowRight, History, FileSearch2, Feather, MessageSquare, Puzzle, Loader2, Cpu, Globe, Server } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QuickToolCard } from './quick-tool-card';
import { ViewMode } from '@/types/scholarly';

interface DashboardViewProps {
  t: any;
  effectiveApiKey: string | undefined;
  isLocalMode: boolean;
  aiPrefs: any;
  setAiPrefs: (prefs: any) => void;
  systemConfig: any;
  assistantTerm: string;
  setAssistantTerm: (term: string) => void;
  handleSearch: (term: string, type: ViewMode) => void;
  isLoading: boolean;
  historyItems: any[];
  setActiveTab: (tab: ViewMode) => void;
  activeModules: any[];
}

export const DashboardView = memo(({ 
  t, 
  effectiveApiKey, 
  isLocalMode, 
  aiPrefs, 
  setAiPrefs,
  systemConfig,
  assistantTerm, 
  setAssistantTerm, 
  handleSearch, 
  isLoading, 
  historyItems, 
  setActiveTab,
  activeModules
}: DashboardViewProps) => {
  
  // Filter active modules to show as quick tools (excluding dashboard itself and profile)
  const quickTools = activeModules.filter(m => m.id !== 'dashboard' && m.id !== 'profile' && m.id !== 'chat');

  const getTranslatedLabel = (key: string) => {
    const parts = key.split('.');
    let res = t;
    for (const p of parts) res = res?.[p];
    return res || key;
  };

  const handleProviderChange = (val: 'google' | 'local') => {
    const defaultModel = val === 'google' ? 'googleai/gemini-2.5-flash' : (systemConfig?.localModelList?.[0] || 'llama3');
    setAiPrefs({ ...aiPrefs, modelProvider: val, selectedModel: defaultModel });
  };

  const handleModelChange = (val: string) => {
    setAiPrefs({ ...aiPrefs, selectedModel: val });
  };

  return (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                  <Sparkles className={cn("h-6 w-6", effectiveApiKey || isLocalMode ? "text-primary" : "text-muted-foreground")} /> 
                  Research Engine
                </CardTitle>
                <CardDescription>Synthesize deep theological insights from your digital library.</CardDescription>
              </div>
              
              <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
                <Select value={aiPrefs.modelProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger className="h-8 w-[110px] text-[10px] uppercase font-bold tracking-widest border-none bg-transparent shadow-none focus:ring-0">
                    <div className="flex items-center gap-1.5">
                      {isLocalMode ? <Server className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      <SelectValue placeholder="Provider" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google" className="text-[10px] font-bold">GOOGLE AI</SelectItem>
                    <SelectItem value="local" className="text-[10px] font-bold">LOCAL OLLAMA</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-4 w-px bg-border mx-1" />

                <Select value={aiPrefs.selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="h-8 w-[140px] text-[10px] font-mono border-none bg-transparent shadow-none focus:ring-0">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiPrefs.modelProvider === 'google' ? (
                      <>
                        <SelectItem value="googleai/gemini-2.5-flash" className="text-[10px]">gemini-2.5-flash</SelectItem>
                        <SelectItem value="googleai/gemini-2.5-pro" className="text-[10px]">gemini-2.5-pro</SelectItem>
                        <SelectItem value="googleai/gemini-1.5-flash" className="text-[10px]">gemini-1.5-flash</SelectItem>
                      </>
                    ) : (
                      <>
                        {systemConfig?.localModelList?.map((m: string) => (
                          <SelectItem key={m} value={m} className="text-[10px]">{m}</SelectItem>
                        ))}
                        {!systemConfig?.localModelList?.length && <SelectItem value="llama3" className="text-[10px]">llama3</SelectItem>}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Input 
                placeholder={effectiveApiKey || isLocalMode ? `Analyze with ${aiPrefs.selectedModel.split('/').pop()}...` : "AI Engine Configuration Needed"} 
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
        {quickTools.map((mod) => (
          <QuickToolCard 
            key={mod.id}
            title={getTranslatedLabel(mod.labelKey)} 
            desc={`Access the ${mod.id} research module`}
            icon={<mod.icon className="h-6 w-6" />} 
            asLink={mod.path}
            onClick={mod.path ? undefined : () => setActiveTab(mod.id)}
          />
        ))}
        {quickTools.length === 0 && (
          <div className="col-span-full py-12 text-center bg-muted/30 rounded-xl border-2 border-dashed">
            <p className="text-sm text-muted-foreground italic">No additional research modules are currently enabled by the administration.</p>
          </div>
        )}
      </div>
    </div>
  );
});

