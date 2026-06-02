'use client';

import { useState, useEffect } from 'react';
import { collection, doc, query, where, getDocs, setDoc, deleteDoc, getDoc, orderBy } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
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
  Loader2, 
  Layers, 
  RefreshCw,
  Clock,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function APIPortal() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keys, setKeys] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  
  const [newKeyLabel, setNewKeyLabel] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const configSnap = await getDoc(doc(db, 'system', 'config'));
        setSystemConfig(configSnap.data());
        
        const keysRef = collection(db, 'api_keys');
        const q = query(keysRef, where('ownerUid', '==', user.uid), orderBy('createdAt', 'desc'));
        const keysSnap = await getDocs(q);
        setKeys(keysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [db, user]);

  const generateKey = async () => {
    if (!newKeyLabel.trim() || !user) return;
    setCreating(true);
    try {
      const keyId = crypto.randomUUID();
      const apiKeyString = `lv_${crypto.randomUUID().replace(/-/g, '')}`;
      
      // Default to "Basic" or first tier for users
      const defaultTier = systemConfig?.apiTiers?.[0]?.name || "Basic";
      
      const newKey = {
        key: apiKeyString,
        label: newKeyLabel,
        tier: defaultTier,
        ownerUid: user.uid,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0,
        revoked: false
      };
      
      await setDoc(doc(db, 'api_keys', keyId), newKey);
      setKeys([ { id: keyId, ...newKey }, ...keys ]);
      setNewKeyLabel('');
      toast({ title: "API Key Generated", description: "Integration token created successfully." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Generation Failed", description: e.message });
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "API key copied to clipboard." });
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

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md p-10 text-center space-y-4">
        <Key className="h-12 w-12 mx-auto text-primary/20" />
        <h2 className="text-xl font-headline font-bold">Authentication Required</h2>
        <p className="text-muted-foreground">Please sign in to access your personal API portal.</p>
        <Button asChild><Link href="/">Return to Dashboard</Link></Button>
      </Card>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
    </div>
  );

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Key className="text-primary h-8 w-8" /> API Portal
          </h1>
          <p className="text-muted-foreground">Obtain and manage your external integration credentials.</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Research</Link>
        </Button>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Generate New Key</CardTitle>
            <CardDescription>Create a token for third-party tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Key Label</Label>
              <Input placeholder="e.g. My Python Script" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} />
            </div>
            <Alert className="bg-muted/50 text-[10px] py-2">
              <ShieldCheck className="h-3 w-3 mr-2" />
              <AlertDescription>Your initial key will be assigned the <strong>Basic</strong> tier by default.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={generateKey} disabled={creating || !newKeyLabel.trim()}>
              {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
              Generate Access Token
            </Button>
          </CardFooter>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex justify-between items-center">
                My Active Credentials
                <Button variant="ghost" size="sm" onClick={() => window.location.reload()}><RefreshCw className="h-3 w-3" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {keys.map((k) => {
                  const tierData = systemConfig?.apiTiers?.find((t: any) => t.name === k.tier) || { requestsPerDay: 10 };
                  const usagePercent = Math.min(100, (k.usageCount / tierData.requestsPerDay) * 100);
                  
                  return (
                    <div key={k.id} className={cn("p-5 rounded-lg border bg-card/50 transition-all hover:border-primary/30", k.revoked && "opacity-50 grayscale")}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{k.label}</span>
                            <Badge variant="secondary" className="text-[10px] uppercase">{k.tier} Tier</Badge>
                            {k.revoked && <Badge variant="destructive" className="text-[10px]">REVOKED</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded select-all font-mono">
                              {k.key}
                            </code>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => copyToClipboard(k.key)} title="Copy Key">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteKey(k.id)} title="Delete Key">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-primary" /> Daily Usage</span>
                          <span className={cn(usagePercent > 80 ? "text-destructive" : "text-muted-foreground")}>
                            {k.usageCount} / {tierData.requestsPerDay} requests
                          </span>
                        </div>
                        <Progress value={usagePercent} className={cn("h-2", usagePercent > 80 ? "bg-destructive/20" : "")} />
                      </div>
                      
                      <div className="mt-6 pt-4 border-t flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Created {new Date(k.createdAt).toLocaleDateString()}</span>
                        {k.lastUsedAt && <span>Last usage: {new Date(k.lastUsedAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  );
                })}
                {keys.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground italic border-2 border-dashed rounded-xl">
                    <Key className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No API keys provisioned yet. Generate a token to start integrating.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-accent" /> Developer Guide</CardTitle>
              <CardDescription>Authentication for the LexiVerse Research API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Authorize your requests by including your key in the <code>Authorization</code> header as a Bearer token.</p>
              <div className="bg-background p-5 rounded-lg border font-mono text-xs overflow-x-auto shadow-inner">
                <p className="text-accent mb-3"># Research Request Example (cURL)</p>
                <p>curl -X POST https://lexiverse.app/api/v1/research \</p>
                <p>  -H "Authorization: Bearer <span className="text-primary">YOUR_API_KEY</span>" \</p>
                <p>  -H "Content-Type: application/json" \</p>
                <p>  -d '&#123;</p>
                <p>    "term": "Genesis 1:1",</p>
                <p>    "researchContext": ["Scholar Paper excerpt..."]</p>
                <p>  &#125;'</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
