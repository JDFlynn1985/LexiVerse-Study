
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  User,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';

export default function ScholarlyWiki() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  
  const [isProposing, setIsProposing] = useState(false);
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  const [proposal, setProposal] = useState({ title: '', content: '', worksCited: '' });

  useEffect(() => {
    const q = query(
      collection(db, 'wiki_entries'), 
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [db]);

  const handlePropose = async () => {
    if (!user || !proposal.title.trim() || !proposal.content.trim() || !agreedToLicense) return;
    setIsProposing(true);
    try {
      await addDoc(collection(db, 'wiki_entries'), {
        ...proposal,
        status: 'pending',
        authorUid: user.uid,
        authorName: user.displayName || 'Anonymous Scholar',
        createdAt: serverTimestamp(),
        license: 'CC-BY-4.0'
      });
      toast({ title: "Proposal Submitted", description: "Your article has been sent for peer review." });
      setProposal({ title: '', content: '', worksCited: '' });
      setAgreedToLicense(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Submission Failed", description: e.message });
    } finally {
      setIsProposing(false);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
              <GraduationCap className="text-primary h-8 w-8" /> Scholarly Wiki
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">The collaborative peer-reviewed theological knowledge base.</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="shadow-lg"><Plus className="mr-2 h-4 w-4" /> Propose Article</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Propose Wiki Article</DialogTitle>
              <DialogDescription>Your proposal will undergo peer review by the moderation committee.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Article Title</Label>
                <Input placeholder="e.g. The Pauline Concept of Dikaiosyne" value={proposal.title} onChange={e => setProposal({...proposal, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Scholarly Content</Label>
                <Textarea 
                  placeholder="Draft your analysis here..." 
                  className="min-h-[200px]" 
                  value={proposal.content} 
                  onChange={e => setProposal({...proposal, content: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Works Cited (SBL Style)</Label>
                <Input placeholder="Primary and secondary sources..." value={proposal.worksCited} onChange={e => setProposal({...proposal, worksCited: e.target.value})} />
              </div>

              <div className="flex items-start space-x-2 pt-4 border-t">
                <Checkbox 
                  id="license-agreement" 
                  checked={agreedToLicense} 
                  onCheckedChange={(val) => setAgreedToLicense(!!val)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="license-agreement"
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t.contribution.license_agreement}
                  </label>
                  <Link href="/terms" target="_blank" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    {t.contribution.license_link} <ExternalLink className="h-2 w-2" />
                  </Link>
                </div>
              </div>
            </div>
            <Button onClick={handlePropose} disabled={isProposing || !proposal.title.trim() || !agreedToLicense}>
              {isProposing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Peer Review
            </Button>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Search className="h-4 w-4" /> Archive Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input 
                placeholder="Search archive..." 
                className="bg-muted/30"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-primary">Wiki Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved Articles</span>
                <span className="font-bold">{entries.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Researchers</span>
                <span className="font-bold">{Array.from(new Set(entries.map(e => e.authorUid))).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
          ) : selectedEntry ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Button variant="ghost" onClick={() => setSelectedEntry(null)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Archive
              </Button>
              <Card className="shadow-xl border-primary/10 overflow-hidden">
                <div className="h-1 bg-primary w-full" />
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl font-headline mb-2">{selectedEntry.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <User className="h-3 w-3" /> {selectedEntry.authorName} • {new Date(selectedEntry.createdAt?.seconds * 1000).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px]">Licensed under CC BY 4.0</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-lg text-foreground/80 whitespace-pre-wrap">
                    {selectedEntry.content}
                  </div>
                  
                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase text-primary flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Works Cited
                    </h4>
                    <p className="text-sm font-mono text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                      {selectedEntry.worksCited}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredEntries.map(entry => (
                <Card 
                  key={entry.id} 
                  className="hover:shadow-md transition-all cursor-pointer border-primary/5 hover:border-primary/30 group"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg group-hover:text-primary transition-colors">{entry.title}</CardTitle>
                    <CardDescription className="text-xs truncate">{entry.authorName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{entry.content}</p>
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-primary/50 group-hover:text-primary transition-colors">
                      <span>Read Full Entry</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredEntries.length === 0 && (
                <div className="col-span-2 py-20 text-center bg-muted/30 rounded-xl border-2 border-dashed">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground italic">No wiki entries found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
