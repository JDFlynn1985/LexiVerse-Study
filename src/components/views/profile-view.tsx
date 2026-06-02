/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

'use client';

import React, { memo } from 'react';
import { User, Cpu, Loader2, ArrowRight, ExternalLink, Key, Globe, Brain, Sparkles, Server, ShieldCheck, Database, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserProfile, DESIGNATIONS, DENOMINATIONS, ViewMode, AIProvider } from '@/types/scholarly';
import { Separator } from '@/components/ui/separator';

interface ProfileViewProps {
  userProfile: UserProfile;
  effectiveAvatar: string;
  userInstitutionName: string;
  profileDraft: any;
  setProfileDraft: (draft: any) => void;
  institutions: any[];
  updateProfile: () => void;
  isLoading: boolean;
  aiPrefs: any;
  saveAiPreferences: (prefs: any) => void;
  systemConfig: any;
  historyItems: any[];
  handleSearch: (term: string, type: ViewMode) => void;
}

export const ProfileView = memo(({ 
  userProfile, 
  effectiveAvatar, 
  userInstitutionName, 
  profileDraft, 
  setProfileDraft, 
  institutions, 
  updateProfile, 
  isLoading, 
  aiPrefs, 
  saveAiPreferences, 
  systemConfig, 
  historyItems, 
  handleSearch 
}: ProfileViewProps) => {

  if (!profileDraft) return null;

  const handleProviderChange = (val: AIProvider) => {
    let defaultModel = '';
    if (val === 'google') defaultModel = 'googleai/gemini-1.5-flash';
    else if (val === 'openai') defaultModel = 'openai/gpt-4o';
    else if (val === 'anthropic') defaultModel = 'anthropic/claude-3-5-sonnet';
    else if (val === 'mistral') defaultModel = 'mistral/mistral-large-latest';
    else if (val === 'deepseek') defaultModel = 'deepseek/deepseek-chat';
    else if (val === 'xai') defaultModel = 'xai/grok-beta';
    else if (val === 'local') {
      const localModels = systemConfig?.localModelList || [];
      defaultModel = localModels.length > 0 ? `ollama/${localModels[0]}` : 'ollama/llama3';
    }
    
    saveAiPreferences({ modelProvider: val, selectedModel: defaultModel });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-center sm:text-left">Scholar Workstation</h1>
        <p className="text-muted-foreground italic text-xs sm:text-sm text-center sm:text-left">Manage your academic credentials and engine configuration.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-lg border-primary/10 h-fit">
          <CardHeader className="text-center pb-2">
            <div className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32 mb-4">
              <Avatar className="w-full h-full border-4 border-background shadow-xl">
                <AvatarImage src={effectiveAvatar} />
                <AvatarFallback><User className="h-8 w-8 sm:h-12 sm:w-12" /></AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="font-headline text-lg sm:text-xl">{userProfile.displayName}</CardTitle>
            <CardDescription className="truncate px-2 text-xs">{userInstitutionName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50">Display Name</Label>
              <Input className="h-9 text-sm" value={profileDraft.displayName || ''} onChange={e => setProfileDraft({...profileDraft, displayName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50">Designation</Label>
              <Select value={profileDraft.designation || ''} onValueChange={(val: any) => setProfileDraft({...profileDraft, designation: val})}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50">Tradition</Label>
              <Select value={profileDraft.denomination || ''} onValueChange={(val: any) => setProfileDraft({...profileDraft, denomination: val})}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select tradition" /></SelectTrigger>
                <SelectContent>
                  {DENOMINATIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50">Seminary</Label>
              <Select value={profileDraft.institutionId || ''} onValueChange={(val) => setProfileDraft({...profileDraft, institutionId: val})}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select institution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent" className="text-xs">Independent Scholar</SelectItem>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id} className="text-xs">{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full shadow-lg h-10 text-sm" onClick={updateProfile} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null} Save Workstation Info
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-lg sm:text-xl font-headline flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Research Credentials
              </CardTitle>
              <CardDescription className="text-xs">Configure API keys and default engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8 pt-6">
              {/* Global Config */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-primary">
                  <Settings className="h-4 w-4" /> Global Engine
                </div>
                <div className="grid gap-4 sm:grid-cols-2 p-4 bg-muted/30 rounded-xl border">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold">Default AI Provider</Label>
                    <Select value={aiPrefs.modelProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger className="bg-background shadow-sm h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google" className="text-xs">Google AI (Gemini)</SelectItem>
                        <SelectItem value="openai" className="text-xs">OpenAI (GPT-4o)</SelectItem>
                        <SelectItem value="anthropic" className="text-xs">Anthropic (Claude)</SelectItem>
                        <SelectItem value="mistral" className="text-xs">Mistral AI</SelectItem>
                        <SelectItem value="deepseek" className="text-xs">DeepSeek</SelectItem>
                        <SelectItem value="xai" className="text-xs">xAI (Grok)</SelectItem>
                        <SelectItem value="local" className="text-xs">Local Ollama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold">Preferred Model ID</Label>
                    <Input 
                      value={aiPrefs.selectedModel} 
                      onChange={e => saveAiPreferences({ selectedModel: e.target.value })}
                      placeholder="e.g. googleai/gemini-1.5-flash"
                      className="bg-background shadow-sm font-mono text-[10px] h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Providers Grid */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest text-primary">
                  <Globe className="h-4 w-4" /> Provider Keys
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[11px] font-bold">Google Gemini Key</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter API key..." 
                      value={aiPrefs.googleKey || ''} 
                      onChange={e => saveAiPreferences({ googleKey: e.target.value })} 
                      className="bg-background shadow-inner h-9 text-xs"
                    />
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[11px] font-bold">OpenAI API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      value={aiPrefs.openaiKey || ''} 
                      onChange={e => saveAiPreferences({ openaiKey: e.target.value })} 
                      className="bg-background shadow-inner h-9 text-xs"
                    />
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[11px] font-bold">Anthropic Key</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-ant-..." 
                      value={aiPrefs.anthropicKey || ''} 
                      onChange={e => saveAiPreferences({ anthropicKey: e.target.value })} 
                      className="bg-background shadow-inner h-9 text-xs"
                    />
                  </div>
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[11px] font-bold">xAI (Grok) Key</Label>
                    <Input 
                      type="password" 
                      value={aiPrefs.xaiKey || ''} 
                      onChange={e => saveAiPreferences({ xaiKey: e.target.value })} 
                      className="bg-background shadow-inner h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-4 border-t flex items-start gap-3">
               <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
               <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
                 Custom keys are stored only in your encrypted scholarly profile and never shared.
               </p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="py-3 sm:py-4 border-b bg-muted/10">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" /> Recent Activity
                  </CardTitle>
                  <Button variant="link" className="text-[10px] h-fit p-0 uppercase font-bold" asChild>
                    <Link href="/archive">Full Archive <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[180px] sm:h-[200px]">
                <div className="space-y-2">
                  {historyItems.length > 0 ? historyItems.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/50 rounded-lg border text-[11px] sm:text-sm group cursor-pointer hover:border-primary/40 transition-all" 
                      onClick={() => handleSearch(item.term, item.type as any)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{item.term}</span>
                        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase font-medium">{item.type} • {item.date}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                      <Database className="h-8 w-8 mb-2" />
                      <p className="text-xs text-center">No recent activity logged.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

export const ProfileViewSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-10 w-64 bg-muted rounded" />
    <div className="grid gap-8 md:grid-cols-3">
      <div className="h-[500px] bg-muted rounded-xl" />
      <div className="md:col-span-2 space-y-6">
         <div className="h-[400px] bg-muted rounded-xl" />
         <div className="h-[200px] bg-muted rounded-xl" />
      </div>
    </div>
  </div>
);
