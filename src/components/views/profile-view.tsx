
'use client';

import React, { memo } from 'react';
import { User, Cpu, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserProfile, DESIGNATIONS, ViewMode } from '@/types/scholarly';

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
}: ProfileViewProps) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <header><h1 className="text-3xl font-bold font-headline">Scholarly Profile</h1></header>
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
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input value={profileDraft.displayName} onChange={e => setProfileDraft({...profileDraft, displayName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <Label>Academic Designation</Label>
            <Select value={profileDraft.designation} onValueChange={(val: any) => setProfileDraft({...profileDraft, designation: val})}>
              <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
              <SelectContent>
                {DESIGNATIONS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Institution</Label>
            <Select value={profileDraft.institutionId} onValueChange={(val) => setProfileDraft({...profileDraft, institutionId: val})}>
              <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
              <SelectContent>
                {institutions.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
                <SelectItem value="independent">Independent Scholar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={updateProfile} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null} Save Changes
          </Button>
        </CardContent>
      </Card>

      <div className="md:col-span-2 space-y-6">
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" /> AI Hub Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>AI Research Engine</Label>
                <Select value={aiPrefs.modelProvider} onValueChange={(val: 'google' | 'local') => saveAiPreferences({ modelProvider: val, selectedModel: val === 'google' ? 'googleai/gemini-2.5-flash' : (systemConfig?.localModelList?.[0] || 'llama3') })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Gemini (Cloud)</SelectItem>
                    <SelectItem value="local">Ollama (Local Network)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Specific Model</Label>
                {aiPrefs.modelProvider === 'google' ? (
                  <Select value={aiPrefs.selectedModel} onValueChange={(val) => saveAiPreferences({ selectedModel: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="googleai/gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={aiPrefs.selectedModel} onValueChange={(val) => saveAiPreferences({ selectedModel: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {systemConfig?.localModelList?.map((m: string) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                      {!systemConfig?.localModelList?.length && <SelectItem value="llama3">llama3</SelectItem>}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {aiPrefs.modelProvider === 'google' && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-dashed">
                <div className="flex justify-between items-center">
                  <Label>Personal Gemini API Key</Label>
                  <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Get Key <ExternalLink className="h-2 w-2 ml-1" /></a>
                  </Button>
                </div>
                <Input 
                  type="password" 
                  placeholder="Paste your key to use your own quota..." 
                  value={aiPrefs.customApiKey} 
                  onChange={e => saveAiPreferences({ customApiKey: e.target.value })} 
                />
                <p className="text-[10px] text-muted-foreground italic">Your key is stored locally in your browser by default unless cloud sync is active.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg font-headline">Research History</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {historyItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border text-sm group cursor-pointer hover:border-primary/40" onClick={() => handleSearch(item.term, item.type as any)}>
                    <div className="flex flex-col">
                      <span className="font-bold">{item.term}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{item.type} • {item.date}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
));
