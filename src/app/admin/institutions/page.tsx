
'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  School, 
  Plus, 
  Trash2, 
  Loader2, 
  Globe, 
  MapPin,
  Save,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default function InstitutionManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    address: '',
    website: ''
  });

  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;
      try {
        const snap = await getDocs(query(collection(db, 'institutions'), orderBy('name', 'asc')));
        setInstitutions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [db, isAdmin]);

  const handleAdd = async () => {
    if (!newInstitution.name.trim()) return;
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const institutionData = {
        ...newInstitution,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'institutions', id), institutionData);
      setInstitutions(prev => [...prev, { id, ...institutionData }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewInstitution({ name: '', address: '', website: '' });
      toast({ title: "Institution Added", description: `${institutionData.name} is now in the directory.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Addition Failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the institution from the directory.")) return;
    try {
      await deleteDoc(doc(db, 'institutions', id));
      setInstitutions(prev => prev.filter(i => i.id !== id));
      toast({ title: "Institution Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  const filteredInstitutions = institutions.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin && !loading) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Unauthorized Access</CardTitle>
          <CardDescription>Academic governance privileges are required to manage institutions.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full"><Link href="/">Return to Research</Link></Button>
        </CardFooter>
      </Card>
    </div>
  );

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="border-b pb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Link href="/">
               <Button variant="ghost" size="icon" className="rounded-full">
                 <ChevronLeft className="h-5 w-5" />
               </Button>
             </Link>
             <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
               <School className="text-primary h-8 w-8" /> Institution Directory
             </h1>
          </div>
          <p className="text-muted-foreground ml-12">Manage seminaries and universities for scholarly attribution.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Register Institution</CardTitle>
            <CardDescription>Add a new academic body to the system.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <Input 
                placeholder="e.g. Oxford Centre for Hebrew Studies" 
                value={newInstitution.name} 
                onChange={e => setNewInstitution({...newInstitution, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Physical Address</Label>
              <Input 
                placeholder="City, Country" 
                value={newInstitution.address} 
                onChange={e => setNewInstitution({...newInstitution, address: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Official Website</Label>
              <Input 
                placeholder="https://..." 
                value={newInstitution.website} 
                onChange={e => setNewInstitution({...newInstitution, website: e.target.value})} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAdd} disabled={saving || !newInstitution.name.trim()}>
              {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Add to Directory
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-headline">Current Registry</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search registry..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Institution</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell className="font-bold text-sm">{inst.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {inst.address || 'Global'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {inst.website ? (
                          <a href={inst.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(inst.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInstitutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">No matching institutions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
