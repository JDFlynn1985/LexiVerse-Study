
'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { Sparkles, GraduationCap, Clock, ArrowRight, History, FileSearch2, Feather, MessageSquare, Puzzle, Loader2, Cpu, Globe, Server, Brain, Activity, TrendingUp, Mic, MicOff, Search as SearchIcon, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { QuickToolCard } from './quick-tool-card';
import { ViewMode, AIProvider } from '@/types/scholarly';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/ai/flows/transcribe-flow';
import { getTermOfTheDay, type VocabularyOutput } from '@/ai/flows/term-of-the-day-flow';
import { Label } from '@/components/ui/label';

interface DashboardViewProps {
  t: any;
  effectiveApiKey: string | undefined;
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
  momentumData: { day: string, queries: number }[];
}

const PROVIDERS: { id: AIProvider; label: string; icon: any }[] = [
  { id: 'google', label: 'GOOGLE AI', icon: Globe },
  { id: 'openai', label: 'OPENAI', icon: Cpu },
  { id: 'anthropic', label: 'ANTHROPIC', icon: Brain },
  { id: 'mistral', label: 'MISTRAL', icon: Sparkles },
  { id: 'deepseek', label: 'DEEPSEEK', icon: Cpu },
  { id: 'xai', label: 'XAI (ZAI)', icon: Cpu },
  { id: 'local', label: 'LOCAL OLLAMA', icon: Server }
];

export const DashboardView = memo(({ 
  t, 
  effectiveApiKey, 
  aiPrefs, 
  setAiPrefs,
  systemConfig,
  assistantTerm, 
  setAssistantTerm, 
  handleSearch, 
  isLoading, 
  historyItems, 
  setActiveTab,
  activeModules,
  momentumData
}: DashboardViewProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [vocab, setVocab] = useState<VocabularyOutput | null>(null);
  const [vocabLoading, setVocabLoading] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadVocab() {
      try {
        const data = await getTermOfTheDay();
        setVocab(data);
      } catch (e) {
        console.error("Vocab fetch failed");
      } finally {
        setVocabLoading(false);
      }
    }
    loadVocab();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            toast({ title: "Processing Voice...", description: "Transcribing scholarly query via Gemini Multimodal." });
            const result = await transcribeAudio({ audioPart: base64Audio });
            if (result.transcript) {
              setAssistantTerm(result.transcript);
              toast({ title: "Transcription Complete", description: `Parsed: "${result.transcript}"` });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: "Transcription Failed" });
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      toast({ variant: 'destructive', title: "Microphone Access Denied" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const quickTools = activeModules.filter(m => m.id !== 'dashboard' && m.id !== 'profile' && m.id !== 'chat');

  const getTranslatedLabel = (key: string) => {
    const parts = key.split('.');
    let res = t;
    for (const p of parts) res = res?.[p];
    return res || key;
  };

  const handleProviderChange = (val: AIProvider) => {
    let defaultModel = '';
    if (val === 'google') defaultModel = 'googleai/gemini-2.5-flash';
    else if (val === 'openai') defaultModel = 'openai/gpt-4o';
    else if (val === 'anthropic') defaultModel = 'anthropic/claude-3-5-sonnet';
    else if (val === 'mistral') defaultModel = 'mistral/mistral-large-latest';
    else if (val === 'deepseek') defaultModel = 'deepseek/deepseek-chat';
    else if (val === 'xai') defaultModel = 'xai/grok-beta';
    else if (val === 'local') {
      const localModels = systemConfig?.localModelList || [];
      defaultModel = localModels.length > 0 ? `ollama/${localModels[0]}` : 'ollama/llama3';
    }
    
    setAiPrefs({ ...aiPrefs, modelProvider: val, selectedModel: defaultModel });
  };

  const handleModelChange = (val: string) => {
    setAiPrefs({ ...aiPrefs, selectedModel: val });
  };

  const ActiveProviderIcon = PROVIDERS.find(p => p.id === aiPrefs.modelProvider)?.icon || Globe;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold font-headline">{t.dashboard.title}</h1>
              <p className="text-muted-foreground text-lg">{t.dashboard.subtitle}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary h-8 px-4 font-bold tracking-widest text-[10px]">SCHOLAR MODE ACTIVE</Badge>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-xl border-primary/10 bg-card/50 overflow-hidden">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                  <Sparkles className={cn("h-6 w-6", effectiveApiKey || aiPrefs.modelProvider === 'local' ? "text-primary" : "text-muted-foreground")} /> 
                  Research Engine
                </CardTitle>
                <CardDescription>Synthesize deep theological insights from your digital library.</CardDescription>
              </div>
              
              <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-[8px] uppercase opacity-50 px-1">Provider</Label>
                  <Select value={aiPrefs.modelProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="h-8 w-[130px] text-[10px] uppercase font-bold tracking-widest border-none bg-transparent shadow-none focus:ring-0">
                      <div className="flex items-center gap-1.5">
                        <ActiveProviderIcon className="h-3 w-3" />
                        <SelectValue placeholder="Provider" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {aiPrefs.modelProvider === 'local' && (
                  <div className="space-y-1 border-l pl-2">
                    <Label className="text-[8px] uppercase opacity-50 px-1">Local Model</Label>
                    <Select value={aiPrefs.selectedModel} onValueChange={handleModelChange}>
                      <SelectTrigger className="h-8 w-[110px] text-[10px] uppercase font-bold tracking-widest border-none bg-transparent shadow-none focus:ring-0">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {(systemConfig?.localModelList || ['llama3', 'mistral']).map((m: string) => (
                          <SelectItem key={m} value={`ollama/${m}`} className="text-[10px] font-mono">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <Input 
                placeholder={effectiveApiKey || aiPrefs.modelProvider === 'local' ? `Analyze with ${aiPrefs.selectedModel.split('/').pop()}...` : "Select provider & provide API key"} 
                className="h-14 pl-4 pr-32 text-lg rounded-xl shadow-inner border-primary/20"
                value={assistantTerm} 
                onChange={e => setAssistantTerm(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearch(assistantTerm, 'ai-assistant')} 
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button 
                  variant="ghost"
                  className={cn("h-10 w-10 rounded-lg", isRecording ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground")}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button 
                  className="h-10 w-10 rounded-lg"
                  onClick={() => handleSearch(assistantTerm, 'ai-assistant')} 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/20 bg-accent/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Theological Vocabulary
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[140px] flex flex-col justify-center">
            {vocabLoading ? (
              <div className="flex justify-center"><Loader2 className="animate-spin opacity-20" /></div>
            ) : vocab ? (
              <div className="space-y-2 animate-in fade-in">
                <p className="text-lg font-bold text-primary">{vocab.term}</p>
                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter">{vocab.language}</Badge>
                <p className="text-[11px] text-muted-foreground italic line-clamp-3">"{vocab.definition}"</p>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic text-center">Expanding scholarly vocabulary...</p>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-muted/20">
             <span className="text-[9px] font-bold text-muted-foreground">SCHOLARLY DAILY BREAD</span>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
           <div className="h-1 w-8 bg-primary rounded-full" />
           Academic Toolbox
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickTools.map((mod) => (
            <QuickToolCard 
              key={mod.id}
              title={getTranslatedLabel(mod.labelKey)} 
              desc={`Access the ${mod.id} research module`}
              icon={<mod.icon className="h-6 w-6" />} 
              asLink={mod.path}
              onClick={mod.path ? undefined : () => setActiveTab(mod.id as any)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
