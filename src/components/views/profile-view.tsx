/*
 * Title: LexiVerse
 * Copyright © 2026 Joshua Flynn <joshuaflynn040@gmail.com>
 * Source: https://github.com/JDFlynn1985/LexiVerse
 */

'use client';

import React, { memo } from 'react';
import { User, Cpu, Loader2, ArrowRight, ExternalLink, Key, Globe, Brain, Sparkles, Server, ShieldCheck, Database } from 'lucide-react';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline">Scholar Workstation</h1>
        <p className="text-muted-foreground italic">Manage your academic credentials and reasoning engine configuration.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-lg border-primary/10 h-fit">
          <CardHeader className="text-center pb-2">
            <div className="relative mx-auto w-32 h-32 mb-4">
              <Avatar className="w-full h-full border-4 border-background shadow-xl">
                <AvatarImage src={effectiveAvatar} />
                <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="font-headline">{userProfile.displayName}</CardTitle>
            <CardDescription className="truncate px-4">{userInstitutionName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase opacity-50">Display Name</Label>
              <Input value={profileDraft.displayName || ''} onChange={e => setProfileDraft({...profileDraft, displayName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase opacity-50">Academic Designation</Label>
              <Select value={profileDraft.designation || ''} onValueChange={(val: any) => setProfileDraft({...profileDraft, designation: val})}>
                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase opacity-50">Theological Tradition</Label>
              <Select value={profileDraft.denomination || ''} onValueChange={(val: any) => setProfileDraft({...profileDraft, denomination: val})}>
                <SelectTrigger><SelectValue placeholder="Select tradition" /></SelectTrigger>
                <SelectContent>
                  {DENOMINATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase opacity-50">Seminary / Institution</Label>
              <Select value={profileDraft.institutionId || ''} onValueChange={(val) => setProfileDraft({...profileDraft, institutionId: val})}>
                <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="independent">Independent Scholar</SelectItem>
                  {institutions.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full shadow-lg" onClick={updateProfile} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null} Save Workstation Info
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" /> Research Credentials
              </CardTitle>
              <CardDescription>Configure individual API keys for your preferred reasoning engines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Google AI - Primary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                  <Globe className="h-4 w-4" /> Primary Cloud Engine
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                  <Label className="text-xs font-bold">Google Gemini API Key</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter Gemini API key..." 
                    value={aiPrefs.googleKey || ''} 
                    onChange={e => saveAiPreferences({ googleKey: e.target.value })} 
                    className="bg-background shadow-inner"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Required for the AI Study Assistant and Lexicon grounded synthesis.</p>
                </div>
              </div>

              {/* Alternative Providers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                  <Brain className="h-4 w-4" /> Professional Alternatives
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-xs font-bold">OpenAI API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-..." 
                      value={aiPrefs.openaiKey || ''} 
                      onChange={e => saveAiPreferences({ openaiKey: e.target.value })} 
                      className="bg-background shadow-inner"
                    />
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-xs font-bold">Anthropic API Key</Label>
                    <Input 
                      type="password" 
                      placeholder="sk-ant-..." 
                      value={aiPrefs.anthropicKey || ''} 
                      onChange={e => saveAiPreferences({ anthropicKey: e.target.value })} 
                      className="bg-background shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Specialized / Emerging Providers */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                  <Sparkles className="h-4 w-4" /> Specialized Engines
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-3 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[10px] font-bold">Mistral Key</Label>
                    <Input 
                      type="password" 
                      value={aiPrefs.mistralKey || ''} 
                      onChange={e => saveAiPreferences({ mistralKey: e.target.value })} 
                      className="h-8 text-xs bg-background shadow-inner"
                    />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[10px] font-bold">DeepSeek Key</Label>
                    <Input 
                      type="password" 
                      value={aiPrefs.deepseekKey || ''} 
                      onChange={e => saveAiPreferences({ deepseekKey: e.target.value })} 
                      className="h-8 text-xs bg-background shadow-inner"
                    />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border space-y-2">
                    <Label className="text-[10px] font-bold">xAI Key</Label>
                    <Input 
                      type="password" 
                      value={aiPrefs.xaiKey || ''} 
                      onChange={e => saveAiPreferences({ xaiKey: e.target.value })} 
                      className="h-8 text-xs bg-background shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-4 border-t flex items-start gap-3">
               <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                 <strong>Data Privacy:</strong> Custom keys are stored only in your encrypted scholarly profile. LexiVerse uses these keys only for your research sessions, ensuring you maintain absolute control over your API quotas.
               </p>
            </CardFooter>
          </Card>

          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/10">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" /> Research Archive Summary
                  </CardTitle>
                  <Button variant="link" className="text-[10px] h-fit p-0 uppercase font-bold" asChild>
                    <Link href="/archive">View Full Archive <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {historyItems.length > 0 ? historyItems.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border text-sm group cursor-pointer hover:border-primary/40 transition-all" 
                      onClick={() => handleSearch(item.term, item.type as any)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{item.term}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-medium">{item.type} • {item.date}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                      <Database className="h-8 w-8 mb-2" />
                      <p className="text-xs text-center">No recent activity logged in this workstation.</p>
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
