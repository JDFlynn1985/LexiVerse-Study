
'use client';

import { useState, useEffect } from 'react';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  Layers, 
  ExternalLink,
  Ban,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function APIKeyManagement() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<any>(userRef);
  const isAdmin = userProfile?.isAdmin === true;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;
      try {
        const configSnap = await getDoc(doc(db, 'system', 'config'));
        setSystemConfig(configSnap.data());
        
        const keysSnap = await getDocs(query(collection(db, 'api_keys'), orderBy('createdAt', 'desc')));
        setKeys(keysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        if (configSnap.data()?.apiTiers?.length > 0) {
          setSelectedTier(configSnap.data().apiTiers[0].name);
        }
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [db, isAdmin]);

  const generateKey = async () => {
    if (!newKeyLabel.trim() || !selectedTier) return;
    setCreating(true);
    try {
      const keyId = crypto.randomUUID();
      const apiKeyString = `lv_${crypto.randomUUID().replace(/-/g, '')}`;
      
      const newKey = {
        key: apiKeyString,
        label: newKeyLabel,
        tier: selectedTier,
        ownerUid: user?.uid,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0,
        revoked: false
      };
      
      await setDoc(doc(db, 'api_keys', keyId), newKey);
      setKeys([ { id: keyId, ...newKey }, ...keys ]);
      setNewKeyLabel('');
      toast({ title: "API Key Generated", description: "Store this securely. It will not be shown again in full." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
    } finally {
      setCreating(false);
    }
  };

  const toggleRevoke = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'api_keys', id), { revoked: !currentStatus });
      setKeys(keys.map(k => k.id === id ? { ...k, revoked: !currentStatus } : k));
      toast({ title: currentStatus ? "Key Restored" : "Key Revoked" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Are you sure? This will permanently remove the key and its history.")) return;
    try {
      await deleteDoc(doc(db, 'api_keys', id));
      setKeys(keys.filter(k => k.id !== id));
      toast({ title: "Key Deleted" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Deletion Failed" });
    }
  };

  if (!isAdmin) return <div className="p-20 text-center">Unauthorized</div>;
  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="border-b pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Key className="text-primary h-8 w-8" /> API Management
          </h1>
          <p className="text-muted-foreground">Provision and govern external scholarly access.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="h-8 border-primary/20 text-primary uppercase">Tiered Access Active</Badge>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Provision New Key</CardTitle>
            <CardDescription>Grant external integration access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Key Label</Label>
              <Input placeholder="e.g. Scholar Tool A" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assign Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {systemConfig?.apiTiers?.map((t: any) => (
                    <SelectItem key={t.name} value={t.name}>{t.name} ({t.requestsPerDay} req/day)</SelectItem>
                  ))}
                  {!systemConfig?.apiTiers?.length && <SelectItem value="Default">Default (10 req/day)</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={generateKey} disabled={creating || !newKeyLabel.trim()}>
              {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
              Generate Access Token
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex justify-between">
              Active Credentials
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-3 w-3" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id} className={k.revoked ? "opacity-50 grayscale" : ""}>
                    <TableCell className="font-medium">
                      <div>
                        {k.label}
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">
                          {k.key.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{k.tier}</Badge></TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold">{k.usageCount}</span> calls
                    </TableCell>
                    <TableCell>
                      {k.revoked ? 
                        <Badge variant="destructive">REVOKED</Badge> : 
                        <Badge variant="outline" className="border-green-500 text-green-600">ACTIVE</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRevoke(k.id, k.revoked)} title={k.revoked ? "Restore" : "Revoke"}>
                          {k.revoked ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-destructive" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteKey(k.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {keys.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No external access keys provisioned yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> API Integration Guide</CardTitle>
          <CardDescription>How to connect scholarly tools to the LexiVerse research engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-background p-4 rounded-lg border font-mono text-xs overflow-x-auto">
            <p className="text-accent mb-2">// POST /api/v1/research</p>
            <p>Headers: Authorization: Bearer lv_...</p>
            <p>Body: &#123; "term": "Genesis 1:1", "researchContext": ["custom paper text..."] &#125;</p>
          </div>
          <Alert variant="default" className="bg-background/50 border-accent/20">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent font-bold">Secure Verification</AlertTitle>
            <AlertDescription>
              External requests are governed by the same linguistic and theological parameters as the internal research workspace.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
