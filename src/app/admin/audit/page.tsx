
'use client';

/**
 * @fileOverview Governance Audit Dashboard.
 * Provides administrators with real-time oversight of error logs, search analytics, and DMCA complaints.
 */

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  ExternalLink,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function GovernanceAudit() {
  const db = useFirestore();
  const { user } = useUser();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAuditData() {
      if (!isAdmin) return;
      try {
        const [errSnap, searchSnap, dmcaSnap] = await Promise.all([
          getDocs(query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50))),
          getDocs(query(collection(db, 'search_logs'), orderBy('timestamp', 'desc'), limit(50))),
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
    fetchAuditData();
  }, [db, isAdmin]);

  if (!isAdmin && !loading) return <div className="p-20 text-center">Unauthorized</div>;
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
             <Activity className="text-primary h-8 w-8" /> Governance Audit
           </h1>
        </div>
        <p className="text-muted-foreground ml-12">Administrative oversight of scholarly platform stability and integrity.</p>
      </header>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="errors" className="gap-2"><AlertCircle className="h-4 w-4" /> System Errors</TabsTrigger>
          <TabsTrigger value="searches" className="gap-2"><Search className="h-4 w-4" /> Research Trends</TabsTrigger>
          <TabsTrigger value="dmca" className="gap-2"><ShieldAlert className="h-4 w-4" /> DMCA Complaints</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Runtime & Permission Logs</CardTitle>
              <CardDescription>The last 50 recorded system events requiring attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>User</TableHead>
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
                      <TableCell className="text-[10px] text-muted-foreground">{log.userId}</TableCell>
                    </TableRow>
                  ))}
                  {errors.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10">No error logs found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="searches">
          <Card>
            <CardHeader>
              <CardTitle>Research Query Analytics</CardTitle>
              <CardDescription>Analyzing what scholars are searching to prioritize wiki content.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                 {/* Mini stats could go here */}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Scholar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-bold text-primary">{log.term}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[9px] uppercase">{log.type}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-[10px]">{log.uid || 'Guest'}</TableCell>
                    </TableRow>
                  ))}
                  {searches.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10">No search activity logged.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dmca">
          <Card>
            <CardHeader>
              <CardTitle>Legal Infringement Queue</CardTitle>
              <CardDescription>Formal complaints requiring investigation and resolution.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complaints.map(dmca => (
                  <Card key={dmca.id} className="border-destructive/20 overflow-hidden shadow-sm">
                    <div className="h-1 bg-destructive w-full" />
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-headline">Complaint: {dmca.contentType} #{dmca.contentId}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                             <Clock className="h-3 w-3" /> Submitted {new Date(dmca.createdAt?.seconds * 1000).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant={dmca.status === 'resolved' ? 'outline' : 'destructive'} className="uppercase">
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
                          <p>{dmca.complainantAddress}</p>
                        </div>
                      </div>
                      <div className="text-sm p-4 border rounded-lg bg-background font-serif italic">
                        "{dmca.infringementDescription}"
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                        <User className="h-3 w-3" /> Signed: <span className="text-foreground font-bold">{dmca.digitalSignature}</span>
                      </div>
                    </CardContent>
                    <div className="p-4 bg-muted/30 border-t flex justify-end gap-2">
                      <Button variant="outline" size="sm">Dismiss</Button>
                      <Button size="sm" className="gap-2"><CheckCircle2 className="h-3 w-3" /> Mark Resolved</Button>
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
