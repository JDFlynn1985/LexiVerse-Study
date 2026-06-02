
'use client';

/**
 * @fileOverview Audio Exegesis Hub View.
 * Converts research reports into scholarly audio synthesis.
 */

import React, { memo, useState } from 'react';
import { Volume2, Mic, Loader2, Play, Sparkles, Download, Music, Headphones, Info, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateAudioExegesis } from '@/ai/flows/audio-exegesis-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const AudioHubView = memo(() => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<'Algenib' | 'Achernar' | 'Sirius'>('Algenib');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateAudioExegesis({ text, voice });
      setAudioUri(result.mediaUri);
      toast({ title: "Synthesis Complete", description: "Scholarly audio exegesis is ready for playback." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Synthesis Failed", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <Volume2 className="h-8 w-8 text-primary" /> Audio Exegesis Hub
        </h1>
        <p className="text-muted-foreground">Convert synthesized research into high-fidelity academic narration.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Mic className="h-4 w-4" /> Script Input
              </CardTitle>
              <CardDescription>Paste research findings or exegesis reports for narration.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Textarea 
                placeholder="Paste research text here..." 
                className="min-h-[300px] font-serif leading-relaxed shadow-inner"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase opacity-50 px-1">Select Narrator Voice</label>
                <Select value={voice} onValueChange={(val: any) => setVoice(val)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Algenib">Professor Algenib (Authoritative)</SelectItem>
                    <SelectItem value="Achernar">Researcher Achernar (Clarity)</SelectItem>
                    <SelectItem value="Sirius">Scholar Sirius (Eloquent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4">
              <Button className="w-full shadow-lg" size="lg" onClick={handleGenerate} disabled={isLoading || !text.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Audio Synthesis
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="min-h-[400px] flex flex-col shadow-xl border-primary/10 overflow-hidden bg-card/50">
            <CardHeader className="border-b bg-muted/20">
               <CardTitle className="text-lg font-headline flex items-center gap-2">
                 <Headphones className="h-5 w-5 text-primary" /> Academic Playback
               </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
               {audioUri ? (
                 <div className="w-full space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="p-8 bg-primary/5 rounded-full w-fit mx-auto border-4 border-background shadow-xl">
                       <Music className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-xl font-headline font-bold">Research Audio Ready</h3>
                       <audio controls src={audioUri} className="w-full h-12" />
                    </div>
                    <div className="flex gap-2 justify-center">
                       <Button variant="outline" size="sm" className="gap-2" asChild>
                          <a href={audioUri} download="lexiverse-exegesis.wav">
                             <Download className="h-3 w-3" /> Download WAV
                          </a>
                       </Button>
                    </div>
                 </div>
               ) : (
                 <div className="opacity-20 space-y-4">
                    <Volume2 className="h-24 w-24 mx-auto" />
                    <p className="italic font-headline text-lg">No Audio Synthesized Yet</p>
                 </div>
               )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4">
               <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    <strong>Audio Processing:</strong> Text-to-Speech synthesis is performed via the Gemini Multimodal engine. No data is stored beyond the current session duration.
                  </p>
               </div>
            </CardFooter>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
             <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                  <Info className="h-4 w-4" /> Scholarly Use Case
                </CardTitle>
             </CardHeader>
             <CardContent className="text-[11px] leading-relaxed text-muted-foreground italic">
                "Enable auditory review of theological papers. The audio generator preserves technical terminology and provides a high-clarity output for seminarians on the go."
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
