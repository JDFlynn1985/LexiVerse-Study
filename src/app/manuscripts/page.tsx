
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Loader2, 
  ArrowLeft, 
  Scroll, 
  Sparkles, 
  Copy, 
  Languages, 
  Search,
  Info,
  FileSearch2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractTextFromImage } from '@/ai/flows/ocr-flow';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function ManuscriptHub() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setOcrResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!imagePreview) return;
    setIsProcessing(true);
    try {
      const result = await extractTextFromImage({ imagePart: imagePreview });
      setOcrResult(result.text);
      toast({ title: "Transcription Complete", description: "Manuscript text has been successfully extracted." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Hub Error", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
              <FileSearch2 className="text-primary h-8 w-8" /> Manuscript Analysis
            </h1>
            <p className="text-muted-foreground italic">Paleographic OCR and linguistic transcription hub.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Badge variant="secondary" className="h-8 uppercase tracking-widest text-[10px] px-3">Gemini Vision Active</Badge>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-6">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Source Manuscript
              </CardTitle>
              <CardDescription>Upload an image of an ancient manuscript, papyrus fragment, or scholarly paper.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div 
                className={cn(
                  "relative aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-muted/20",
                  imagePreview ? "border-primary/40" : "border-muted-foreground/20 hover:border-primary/20"
                )}
              >
                {imagePreview ? (
                  <Image src={imagePreview} alt="Manuscript Preview" fill className="object-contain p-2" />
                ) : (
                  <div className="text-center p-10 space-y-2">
                    <Scroll className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Select or drop an image file</p>
                  </div>
                )}
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-accent/5 rounded-lg border border-accent/20">
                <Info className="h-4 w-4 text-accent" />
                <p className="text-[10px] text-muted-foreground leading-snug">
                  High-resolution images yield better results for archaic scripts (Greek/Hebrew/Latin).
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4 flex justify-between">
              <Button variant="ghost" onClick={() => { setImagePreview(null); setOcrResult(null); }} disabled={!imagePreview}>Reset</Button>
              <Button onClick={handleProcess} disabled={!imagePreview || isProcessing} className="shadow-lg">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze Manuscript
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-accent/20">
            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">Linguistic Guide</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>
                <p><strong>Transcription</strong>: The AI extracts exact characters and maintains original layout.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">2</Badge>
                <p><strong>Translation</strong>: Use the Synthesis Hub to translate extracted ancient text.</p>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">3</Badge>
                <p><strong>Analysis</strong>: Cross-reference findings with the Lexicon using the generated text.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="min-h-[500px] shadow-xl border-primary/10 flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" /> Transcription Result
                </CardTitle>
                <div className="flex gap-2">
                   {ocrResult && (
                     <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                       {isCopied ? "Copied!" : <><Copy className="mr-2 h-3 w-3" /> Copy</>}
                     </Button>
                   )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 pt-6">
              {ocrResult ? (
                <div className="bg-background rounded-xl border p-6 font-mono text-sm leading-loose whitespace-pre-wrap shadow-inner min-h-[300px]">
                  {ocrResult}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20 opacity-30">
                  <Scroll className="h-16 w-16" />
                  <p className="text-sm italic">Analyze a manuscript to see transcription.</p>
                </div>
              )}
            </CardContent>
            {ocrResult && (
              <CardFooter className="bg-muted/30 border-t p-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/"><Search className="mr-2 h-3 w-3" /> Lexicon Look-up</Link>
                </Button>
                <Button size="sm">
                  Save to Research Library
                </Button>
              </CardFooter>
            )}
          </Card>

          {ocrResult && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <Card className="bg-primary text-primary-foreground">
                 <CardHeader className="pb-3">
                   <CardTitle className="text-sm flex items-center gap-2">
                     <Sparkles className="h-4 w-4 text-accent" /> Scholarly Next Steps
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                    <p className="text-xs opacity-90 leading-relaxed">
                      Now that you have transcribed this text, you can move it to the <strong>Writing Hub</strong> to analyze its theological integrity or <strong>format a bibliography</strong> entry for the source manuscript.
                    </p>
                    <div className="flex gap-2 pt-2">
                       <Button variant="secondary" size="sm" className="text-[10px] h-7 font-bold">MOVE TO WRITING HUB</Button>
                       <Button variant="ghost" size="sm" className="text-[10px] h-7 hover:bg-white/10">DISMISS</Button>
                    </div>
                 </CardContent>
               </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
