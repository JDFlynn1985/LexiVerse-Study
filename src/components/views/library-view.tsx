'use client';

/**
 * @fileOverview Library Hub View.
 * Manage network-isolated research papers for local RAG context.
 * Enhanced with automated metadata and content sanitization.
 */

import React, { memo, useState } from 'react';
import { Library, Upload, Trash2, FileText, Loader2, Info, Search, BookOpen, CheckCircle2, Languages } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/lib/document-parser';
import { saveLocalDocument, deleteLocalDocument, type IDBDocument } from '@/lib/idb';
import { sanitizeHtml, sanitizeFilename } from '@/lib/sanitization';
import { cn } from '@/lib/utils';

interface LibraryViewProps {
  documents: IDBDocument[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LibraryView = memo(({ documents, onRefresh, isLoading }: LibraryViewProps) => {
  const { toast } = useToast();
  const [isParsing, setIsParsing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      // 1. Extract raw content
      const rawContent = await parseDocument(file);
      
      // 2. Apply metadata and content sanitization
      const cleanName = sanitizeFilename(file.name);
      const cleanContent = sanitizeHtml(rawContent);

      const newDoc: IDBDocument = {
        id: crypto.randomUUID(),
        name: cleanName,
        type: file.type,
        content: cleanContent,
        uploadDate: new Date().toISOString(),
        synced: false
      };

      // 3. Persist to local IndexedDB
      await saveLocalDocument(newDoc);
      toast({ 
        title: "Paper Indexed", 
        description: `${cleanName} successfully sanitized and added to library.` 
      });
      onRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Parsing Failed", description: e.message });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLocalDocument(id);
      onRefresh();
      toast({ title: "Paper Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" /> Digital Library
          </h1>
          <p className="text-muted-foreground">Manage network-isolated research papers for AI context.</p>
        </div>
        <div className="relative">
          <Button disabled={isParsing} className="shadow-lg relative overflow-hidden">
            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isParsing ? 'Sanitizing...' : 'Add Research Paper'}
            <input 
              type="file" 
              accept=".pdf,.docx,.txt" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileUpload} 
              disabled={isParsing}
            />
          </Button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Indexed Papers</CardTitle>
                <div className="relative w-64">
                   <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                     placeholder="Search library..." 
                     className="pl-8 h-9" 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/5 rounded border border-primary/10">
                           <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{Math.round(doc.content.length / 5).toLocaleString()} words</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] gap-1 border-green-500/30 text-green-600">
                          <CheckCircle2 className="h-2 w-2" /> Context Active
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" 
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredDocs.length === 0 && (
                    <div className="py-20 text-center space-y-4 opacity-30">
                       <BookOpen className="h-12 w-12 mx-auto" />
                       <p className="italic text-sm">Your digital library is currently empty.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="bg-muted/10 p-3 border-t">
               <p className="text-[10px] text-muted-foreground italic">
                 <strong>Privacy & Security:</strong> Documents are sanitized and stored locally in your browser's IndexedDB. They never touch LexiVerse or Google servers.
               </p>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Info className="h-5 w-5 text-accent" /> RAG Attribution
              </CardTitle>
              <CardDescription>How cited context works.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                The <strong>AI Study Assistant</strong> now uses multi-document grounding. Insights derived from your papers are cited using their filename.
              </p>
              <div className="p-3 bg-background rounded-lg border text-xs italic">
                "According to recent research, the linguistic root 'logos' conveys specific ontological weight [Ref: TheologyPaper.pdf]."
              </div>
              <ul className="space-y-2 text-xs">
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent mt-0.5" />
                    <span>Automatic source identification.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent mt-0.5" />
                    <span>Cross-document synthesis logic.</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent mt-0.5" />
                    <span>Instant character indexing.</span>
                 </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-primary text-primary-foreground">
             <CardHeader>
               <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
                 <Languages className="h-4 w-4" /> Global Research
               </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-[11px] opacity-80 leading-relaxed italic">
                  Upload multiple synoptic papers to perform comparative cross-document analysis. The AI engine ranks chunks by semantic relevance across your entire indexed library.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
