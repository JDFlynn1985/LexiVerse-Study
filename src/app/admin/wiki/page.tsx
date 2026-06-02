
'use client';

/**
 * @fileOverview Wiki Moderation Portal.
 * Enhanced with automated notification triggers for authors.
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, 
  Loader2, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  User, 
  Clock,
  ExternalLink,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function WikiModeration() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  useEffect(() => {
    if (!isAdmin || !db) return;
    const q = query(collection(db, 'wiki_entries'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [db, isAdmin]);

  const handleAction = async (entry: any, action: 'approved' | 'rejected') => {
    if (!db || !user) return;
    try {
      // 1. Update Entry
      await updateDoc(doc(db, 'wiki_entries', entry.id), {
        status: action,
        moderatedBy: user.uid,
        moderatedAt: serverTimestamp()
      });

      // 2. Notify Author
      await addDoc(collection(db, 'users', entry.authorUid, 'notifications'), {
        userId: entry.authorUid,
        title: `Article ${action === 'approved' ? 'Approved' : 'Revision Required'}`,
        message: `Your article "${entry.title}" has been ${action === 'approved' ? 'published to the Scholarly Wiki' : 'rejected by the moderation committee'}.`,
        type: 'wiki_status',
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: `Article ${action === 'approved' ? 'Approved' : 'Rejected'}` });
      if (selectedEntry?.id === entry.id) setSelectedEntry(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Action Failed", description: e.message });
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure? This will permanently remove the proposal.")) return;
    try {
      await deleteDoc(doc(db, 'wiki_entries', id));
      toast({ title: "Proposal Deleted" });
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  if (!isAdmin && !loading) return <div className="p-20 text-center font-headline text-2xl">Access Restricted to Moderation Committee</div>;
  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="border-b pb-6">
        <div className="flex items-center gap-2 mb-2">
           <Link href="/">
             <Button variant="ghost" size="icon" className="rounded-full">
               <ChevronLeft className="h-5 w-5" />
             </Button>
           </Link>
           <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
             <UserCheck className="text-primary h-8 w-8" /> Wiki Peer-Review
           </h1>
        </div>
        <p className="text-muted-foreground ml-12">Moderation portal for pending scholarly contributions.</p>
      </header>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Proposals ({entries.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y max-h-[600px] overflow-y-auto">
                 {entries.map(entry => (
                   <div 
                    key={entry.id} 
                    className={cn(
                      "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                      selectedEntry?.id === entry.id ? "bg-primary/5 border-l-4 border-primary" : ""
                    )}
                    onClick={() => setSelectedEntry(entry)}
                   >
                     <p className="font-bold text-sm truncate">{entry.title}</p>
                     <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <User className="h-3 w-3" /> {entry.authorName}
                     </div>
                   </div>
                 ))}
                 {entries.length === 0 && (
                   <div className="p-10 text-center opacity-30 italic text-sm">No pending proposals requiring review.</div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          {selectedEntry ? (
            <Card className="shadow-xl border-primary/10 overflow-hidden animate-in slide-in-from-right-4">
              <div className="h-1.5 bg-yellow-500 w-full" />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-headline mb-2">{selectedEntry.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="h-3 w-3" /> {selectedEntry.authorName} • <Clock className="h-3 w-3" /> {new Date(selectedEntry.createdAt?.seconds * 1000).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-50/50 uppercase text-[10px]">PENDING REVIEW</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-foreground/80 whitespace-pre-wrap bg-muted/10 p-6 rounded-xl border">
                  {selectedEntry.content}
                </div>
                <Separator />
                <div>
                  <h4 className="font-bold text-xs uppercase text-primary mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Works Cited</h4>
                  <p className="text-xs font-mono text-muted-foreground bg-muted/30 p-4 rounded-lg border italic">{selectedEntry.worksCited || "No sources cited in proposal."}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 border-t flex justify-between">
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEntry(selectedEntry.id)}>
                   <Trash2 className="h-4 w-4 mr-2" /> Delete Proposal
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleAction(selectedEntry, 'rejected')}>
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(selectedEntry, 'approved')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-primary/5">
              <ShieldAlert className="h-16 w-16 text-primary opacity-10 mb-4" />
              <h3 className="text-xl font-headline font-bold text-muted-foreground">Select a Proposal</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 italic">Review the article content and citations before granting scholarly approval.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
