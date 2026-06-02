'use client';

/**
 * @fileOverview Governance Audit Dashboard.
 * Enhanced with Top Research Topics visualization.
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertCircle, 
  Search, 
  ShieldAlert, 
  Loader2, 
  ChevronLeft,
  Clock,
  User,
  Trash2,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Flame,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { cn } from '@/lib/utils';

export default function GovernanceAudit() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  async function fetchAuditData() {
    if (!isAdmin) return;
    try {
      const [errSnap, searchSnap, dmcaSnap] = await Promise.all([
        getDocs(query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50))),
        getDocs(query(collection(db, 'search_logs'), orderBy('timestamp', 'desc'), limit(500))),
        getDocs(query(collection(db, 'dmca_complaints'), orderBy('createdAt', 'desc'), limit(20)))
      ]);

      setErrors(errSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSearches(searchSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setComplaints(dmcaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Audit fetch failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuditData();
  }, [db, isAdmin]);

  const searchStats = useMemo(() => {
    const stats: Record<string, number> = {};
    searches.forEach(s => {
      const type = s.type || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [searches]);

  const topTopics = useMemo(() => {
    const counts: Record<string, number> = {};
    searches.forEach(s => {
      const term = s.term?.toLowerCase().trim();
      if (term) counts[term] = (counts[term] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }));
  }, [searches]);

  const resolveDMCA = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, 'dmca_complaints', complaintId), {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        resolvedBy: user?.uid
      });
      setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: 'resolved' } : c));
      toast({ title: "Complaint Resolved" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
    }
  };

  const dismissLog = async (col: string, id: string) => {
    try {
      await deleteDoc(doc(db, col, id));
      if (col === 'error_logs') setErrors(prev => prev.filter(e => e.id !== id));
      if (col === 'dmca_complaints') setComplaints(prev => prev.filter(c => c.id !== id));
      toast({ title: "Log Dismissed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
    }
  };

  const COLORS = ['#301934', '#DAA520', '#3B82F6', '#10B981', '#F43F5E'];

  if (!isAdmin && !loading) return <div className="p-20 text-center font-headline text-2xl">Access Restricted to System Administrators</div>;
  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

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
             <Activity className="text-primary h-8 w-8" /> Governance Audit
           </h1>
        </div>
        <p className="text-muted-foreground ml-12">Administrative oversight of scholarly platform stability and integrity.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <BarChart3 className="h-4 w-4" /> Theological Research Trends
            </CardTitle>
            <CardDescription>Volume of queries by scholarly module.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={searchStats} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <ChartTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {searchStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter className="bg-muted/10 p-3 border-t">
             <div className="flex justify-between items-center w-full text-[10px] font-bold text-muted-foreground px-2">
                <span>TOTAL LOGGED QUERIES: {searches.length}</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-accent" /> REAL-TIME ANALYTICS</span>
             </div>
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-accent/20 bg-accent/5">
          <CardHeader>
             <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent flex items-center gap-2">
               <Flame className="h-4 w-4" /> High-Demand Topics
             </CardTitle>
             <CardDescription>Trending search terms for Wiki population.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               {topTopics.map((topic, i) => (
                 <div key={i} className="p-3 bg-background rounded-lg border flex items-center justify-between shadow-sm group hover:border-accent/40 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <Award className={cn("h-4 w-4 shrink-0", i === 0 ? "text-accent" : "text-muted-foreground/30")} />
                       <span className="text-sm font-bold truncate capitalize">{topic.term}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{topic.count} hits</Badge>
                 </div>
               ))}
               {topTopics.length === 0 && <p className="text-center text-xs text-muted-foreground italic py-10">Accumulating trending data...</p>}
             </div>
             
             <Separator />
             
             <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-background rounded-lg border text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">Alerts</p>
                   <p className="text-xl font-bold text-destructive">{errors.length}</p>
                </div>
                <div className="p-3 bg-background rounded-lg border text-center">
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">DMCA</p>
                   <p className="text-xl font-bold">{complaints.filter(c => c.status === 'pending').length}</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="searches" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="searches" className="gap-2"><Search className="h-4 w-4" /> Search Logs</TabsTrigger>
          <TabsTrigger value="errors" className="gap-2"><AlertCircle className="h-4 w-4" /> Runtime Errors</TabsTrigger>
          <TabsTrigger value="dmca" className="gap-2"><ShieldAlert className="h-4 w-4" /> DMCA Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="searches">
          <Card>
            <CardHeader>
              <CardTitle>Research Query Feed</CardTitle>
              <CardDescription>Historical log of all scholarly searches.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Term</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Researcher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-bold text-primary">{log.term}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[9px] uppercase">{log.type}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-[10px] font-mono">{log.uid?.substring(0, 8)}...</TableCell>
                    </TableRow>
                  ))}
                  {searches.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 italic opacity-50">No search activity logged.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Platform Stability Logs</CardTitle>
              <CardDescription>Reviewing technical and permission-based exceptions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-[10px] whitespace-nowrap">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.type === 'firebase-permission' ? 'destructive' : 'outline'} className="text-[10px] uppercase">
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={log.message}>{log.message}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => dismissLog('error_logs', log.id)}>
                           <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {errors.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 italic opacity-50">No stability issues logged.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dmca">
          <Card>
            <CardHeader>
              <CardTitle>Copyright & Intellectual Property Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.map(dmca => (
                  <Card key={dmca.id} className={cn("overflow-hidden shadow-sm transition-all border-l-4", dmca.status === 'resolved' ? "border-l-green-500 bg-green-50/5" : "border-l-destructive")}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-headline">Complaint: {dmca.contentType} #{dmca.contentId?.substring(0, 8)}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                             <Clock className="h-3 w-3" /> Submitted {new Date(dmca.createdAt?.seconds * 1000).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant={dmca.status === 'resolved' ? 'outline' : 'destructive'} className={cn("uppercase", dmca.status === 'resolved' && "text-green-600 border-green-500")}>
                          {dmca.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-bold text-primary mb-1">Complainant</p>
                          <p>{dmca.complainantName}</p>
                          <p className="text-muted-foreground">{dmca.complainantEmail}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-bold text-primary mb-1">Physical Address</p>
                          <p className="truncate">{dmca.complainantAddress}</p>
                        </div>
                      </div>
                      <div className="text-sm p-4 border rounded-lg bg-background font-serif italic shadow-inner">
                        "{dmca.infringementDescription}"
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <User className="h-3 w-3" /> Signed: <span className="text-foreground font-bold">{dmca.digitalSignature}</span>
                      </div>
                    </CardContent>
                    <div className="p-4 bg-muted/30 border-t flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => dismissLog('dmca_complaints', dmca.id)}>Dismiss</Button>
                      {dmca.status !== 'resolved' && (
                        <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => resolveDMCA(dmca.id)}>
                          <CheckCircle2 className="h-3 w-3" /> Mark Resolved
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
                {complaints.length === 0 && (
                   <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                      <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground italic">No legal complaints on file.</p>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
