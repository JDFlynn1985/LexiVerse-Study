
'use client';

/**
 * @fileOverview Research Archive Hub.
 * Restores complex AI research sessions from Firestore.
 */

import React, { memo, useState } from 'react';
import { Archive, Search, Loader2, Trash2, ExternalLink, Calendar, BookOpen, Sparkles, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/types/scholarly';

interface ArchiveViewProps {
  onRestore: (type: ViewMode, data: any) => void;
}

export const ArchiveView = memo(({ onRestore }: ArchiveViewProps) => {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const sessionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.uid]);

  const { data: sessions, loading } = useCollection<any>(sessionsQuery);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db || !user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
      toast({ title: "Session Deleted" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'assistant': return <Sparkles className="h-4 w-4 text-primary" />;
      case 'lexicon': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'theology': return <History className="h-4 w-4 text-primary" />;
      default: return <Archive className="h-4 w-4 text-primary" />;
    }
  };

  if (!user) return <div className="p-20 text-center italic">Please sign in to access your research archive.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Archive className="h-8 w-8 text-primary" /> Research Archive
          </h1>
          <p className="text-muted-foreground">Restore and manage your saved exegesis and synthesis reports.</p>
        </div>
        <div className="relative w-64">
           <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search archive..." 
             className="pl-8 h-10 shadow-sm" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-40 bg-muted/30 rounded-[3rem] border-2 border-dashed">
          <Archive className="h-20 w-20 mx-auto mb-4 text-primary opacity-5" />
          <h3 className="text-xl font-headline font-bold text-muted-foreground">Your Archive is Empty</h3>
          <p className="text-sm text-muted-foreground italic">Save research sessions from the Assistant or Lexicon tools to see them here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id} 
              className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all overflow-hidden flex flex-col"
              onClick={() => onRestore(session.type, session.data)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                    {getIconForType(session.type)}
                  </div>
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-widest">{session.type}</Badge>
                </div>
                <CardTitle className="font-headline text-lg mt-3 truncate">{session.title}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-[10px]">
                  <Calendar className="h-3 w-3" />
                  {session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                 <p className="text-xs text-muted-foreground line-clamp-3 italic">
                   {session.data?.aiInsights?.substring(0, 150) || session.data?.summary?.substring(0, 150) || "No preview available."}...
                 </p>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-3 flex justify-between">
                 <Button variant="ghost" size="sm" className="text-[10px] h-8 gap-2 group-hover:text-primary">
                    Restore Session <ExternalLink className="h-3 w-3" />
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" 
                   onClick={(e) => handleDelete(e, session.id)}
                 >
                   <Trash2 className="h-3 w-3" />
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
});
