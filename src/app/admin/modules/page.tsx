
'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Puzzle, 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronLeft,
  Settings,
  Layers,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ICON_MAP, getIconByName } from '@/lib/icons';

export default function ModuleManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  
  const [newModule, setNewModule] = useState({
    id: '',
    labelKey: '',
    iconName: 'puzzle',
    group: 'ai_hub',
    enabled: true, // New modules enabled by default
    adminOnly: false
  });

  useEffect(() => {
    async function fetchModules() {
      if (!isAdmin) return;
      try {
        const snap = await getDocs(query(collection(db, 'modules'), orderBy('id', 'asc')));
        setModules(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();
  }, [db, isAdmin]);

  const handleToggle = async (module: any) => {
    try {
      const docRef = doc(db, 'modules', module.docId);
      await updateDoc(docRef, { enabled: !module.enabled });
      setModules(modules.map(m => m.docId === module.docId ? { ...m, enabled: !module.enabled } : m));
      toast({ title: "Module Updated", description: `${module.id} status changed.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: e.message });
    }
  };

  const handleAdd = async () => {
    if (!newModule.id.trim() || !newModule.labelKey.trim()) return;
    setSaving(true);
    try {
      const docId = `${newModule.id}-${Date.now()}`;
      await setDoc(doc(db, 'modules', docId), {
        ...newModule,
        createdAt: new Date().toISOString()
      });
      setModules([...modules, { docId, ...newModule }].sort((a, b) => a.id.compareLocale(b.id)));
      setNewModule({ id: '', labelKey: '', iconName: 'puzzle', group: 'ai_hub', enabled: true, adminOnly: false });
      toast({ title: "Module Registered", description: "Successfully added to the scholarly registry." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Addition Failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure? This will remove the module registry. The code files will remain, but the tool will be hidden.")) return;
    try {
      await deleteDoc(doc(db, 'modules', docId));
      setModules(modules.filter(m => m.docId !== docId));
      toast({ title: "Registry Removed" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  if (!isAdmin && !loading) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle>Unauthorized Access</CardTitle>
          <CardDescription>Academic governance privileges are required to manage system modules.</CardDescription>
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
               <Layers className="text-primary h-8 w-8" /> Module Governance
             </h1>
          </div>
          <p className="text-muted-foreground ml-12">Enable or disable scholarly research tools across the platform.</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 h-fit shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Register Module</CardTitle>
            <CardDescription>Connect new code components to the UI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Module ID (Code Key)</Label>
              <Input 
                placeholder="e.g. lexicon" 
                value={newModule.id} 
                onChange={e => setNewModule({...newModule, id: e.target.value.toLowerCase()})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Label Key (i18n)</Label>
              <Input 
                placeholder="nav.lexicon" 
                value={newModule.labelKey} 
                onChange={e => setNewModule({...newModule, labelKey: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Display Icon</Label>
              <Select value={newModule.iconName} onValueChange={(val) => setNewModule({...newModule, iconName: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ICON_MAP).map(icon => (
                    <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sidebar Group</Label>
              <Select value={newModule.group} onValueChange={(val: any) => setNewModule({...newModule, group: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="ai_hub">AI Research Hub</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Admin Only</Label>
                <p className="text-[10px] text-muted-foreground">Restrict to scholarly governance roles.</p>
              </div>
              <Switch 
                checked={newModule.adminOnly} 
                onCheckedChange={(val) => setNewModule({...newModule, adminOnly: val})} 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAdd} disabled={saving || !newModule.id.trim()}>
              {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              Register Module
            </Button>
          </CardFooter>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Active Tool Registry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((m) => {
                    const IconComp = getIconByName(m.iconName);
                    return (
                      <TableRow key={m.docId} className={!m.enabled ? "opacity-60" : ""}>
                        <TableCell>
                          <IconComp className="h-4 w-4 text-primary" />
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{m.id}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{m.labelKey}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">{m.group}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <Switch 
                               checked={m.enabled} 
                               onCheckedChange={() => handleToggle(m)} 
                             />
                             {m.enabled ? 
                               <CheckCircle2 className="h-3 w-3 text-green-600" /> : 
                               <XCircle className="h-3 w-3 text-destructive" />
                             }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m.docId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {modules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No modules registered in Firestore.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 border-t">
             <p className="text-[10px] text-muted-foreground italic leading-snug">
               <strong>Note:</strong> Modules listed here must also have their React components registered in <code>src/app/page.tsx</code> to function correctly.
             </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
