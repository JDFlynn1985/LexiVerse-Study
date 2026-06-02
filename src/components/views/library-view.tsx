
'use client';

/**
 * @fileOverview Library Hub View.
 * Manage network-isolated research papers and cloud-indexed Vector Search.
 * Enhanced with automated metadata and semantic indexing capabilities.
 */

import React, { memo, useState } from 'react';
import { Library, Upload, Trash2, FileText, Loader2, Info, Search, BookOpen, CheckCircle2, Languages, CloudUpload, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { parseDocument } from '@/lib/document-parser';
import { saveLocalDocument, deleteLocalDocument, updateLocalDocument, type IDBDocument } from '@/lib/idb';
import { sanitizeHtml, sanitizeFilename } from '@/lib/sanitization';
import { indexLibraryDocument } from '@/ai/flows/vector-search-flow';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface LibraryViewProps {
  documents: IDBDocument[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const LibraryView = memo(({ documents, onRefresh, isLoading }: LibraryViewProps) => {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isParsing, setIsParsing] = useState(false);
  const [isIndexing, setIsIndexing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const rawContent = await parseDocument(file);
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

      await saveLocalDocument(newDoc);
      toast({ 
        title: "Paper Indexed Locally", 
        description: `${cleanName} added to research library.` 
      });
      onRefresh();
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Parsing Failed", description: e.message });
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleCloudSync = async (docObj: IDBDocument) => {
    if (!user || !db) return;
    setIsIndexing(docObj.id);
    try {
      // 1. Generate Embeddings server-side
      const chunksWithEmbeds = await indexLibraryDocument({
        docId: docObj.id,
        docName: docObj.name,
        content: docObj.content,
        userId: user.uid
      });

      // 2. Persist Chunks to Firestore for Vector Search
      const chunksRef = collection(db, 'users', user.uid, 'chunks');
      await Promise.all(chunksWithEmbeds.map(chunk => 
        addDoc(chunksRef, {
          ...chunk,
          userId: user.uid,
          docId: docObj.id,
          createdAt: serverTimestamp()
        })
      ));

      // 3. Mark document as synced
      await updateLocalDocument(docObj.id, { synced: true });
      onRefresh();
      toast({ title: "Semantic Indexing Complete", description: "Deep RAG context enabled for this document." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Cloud Indexing Failed", description: e.message });
    } finally {
      setIsIndexing(null);
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
          <p className="text-muted-foreground">Manage network-isolated research papers and semantic vector indices.</p>
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
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Research Inventory</CardTitle>
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
                            <span>{doc.synced ? 'Semantic Index Active' : 'Local Only'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!doc.synced ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1.5" 
                            onClick={() => handleCloudSync(doc)}
                            disabled={isIndexing === doc.id}
                          >
                            {isIndexing === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3" />}
                            Sync to Cloud RAG
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[9px] gap-1 border-green-500/30 text-green-600 bg-green-50/50">
                            <ShieldCheck className="h-2 w-2" /> Vector Search Ready
                          </Badge>
                        )}
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
                 <strong>Vector Search:</strong> Cloud-synced papers use high-dimensional embeddings for superior semantic retrieval precision.
               </p>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Languages className="h-5 w-5 text-accent" /> Semantic Precision
              </CardTitle>
              <CardDescription>Deep RAG Infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                By indexing your papers for <strong>Vector Search</strong>, the AI engine can understand the *meaning* of your query rather than just keyword overlap.
              </p>
              <div className="p-3 bg-background rounded-lg border text-xs">
                <span className="font-bold text-accent">Intent Matching:</span> Search for "Divine Sovereignty" to find fragments about "Supreme Authority" or "Providence".
              </div>
              <ul className="space-y-2 text-xs">
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent mt-0.5" />
                    <span>Gemini Embedding Models (004).</span>
                 </li>
                 <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent mt-0.5" />
                    <span>Theological context awareness.</span>
                 </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});
