
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldCheck, 
  Settings, 
  Key, 
  UserCheck, 
  Loader2, 
  Save, 
  ShieldAlert, 
  CheckCircle2, 
  Server,
  Network,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  WifiOff,
  RefreshCw,
  Download,
  AlertTriangle,
  Database,
  Cpu,
  Brain,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getLocalOllamaModels, pullOllamaModel, deleteOllamaModel } from '@/app/actions/ollama-actions';

export default function AdminSettings() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile, loading: profileLoading } = useDoc<any>(userRef);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [config, setConfig] = useState<any>({
    geminiApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    mistralApiKey: '',
    deepseekApiKey: '',
    xaiApiKey: '',
    ollamaUrl: 'http://localhost:11434',
    defaultModelProvider: 'google',
    defaultModel: 'googleai/gemini-2.5-flash',
    localModelList: ['llama3', 'mistral', 'gemma'],
    networkMode: 'internet'
  });
  const [pullModelName, setPullModelName] = useState('');

  const isAdmin = userProfile?.isAdmin === true;

  useEffect(() => {
    async function fetchConfig() {
      if (!isAdmin) return;
      try {
        const snap = await getDoc(doc(db, 'system', 'config'));
        if (snap.exists()) {
          const data = snap.data();
          setConfig({
            ...config,
            ...data
          });
        }
      } catch (e) {
        console.error("Permission denied fetching system config");
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && !profileLoading) fetchConfig();
  }, [db, isAdmin, authLoading, profileLoading]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), { ...config, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Settings Updated" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Update Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    try {
      const result = await getLocalOllamaModels(config.ollamaUrl);
      if (result.models.length > 0) {
        setConfig({ ...config, localModelList: result.models });
        toast({ title: "Models Detected" });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Detection Failed" });
    } finally {
      setDetecting(false);
    }
  };

  if (!user || !isAdmin) return <div className="p-20 text-center">Unauthorized</div>;
  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6 space-y-8">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Settings className="text-primary h-8 w-8" /> System Control Panel
          </h1>
          <p className="text-muted-foreground">Global AI configuration and governance.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Configuration
        </Button>
      </header>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="ai">Cloud Provider Keys</TabsTrigger>
          <TabsTrigger value="local">Local Ollama</TabsTrigger>
          <TabsTrigger value="network">Network & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fallback System Keys</CardTitle>
              <CardDescription>Provide global keys for guest researchers.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Google Gemini Key</Label>
                <Input type="password" value={config.geminiApiKey} onChange={e => setConfig({...config, geminiApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>OpenAI Key</Label>
                <Input type="password" value={config.openaiApiKey} onChange={e => setConfig({...config, openaiApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Anthropic Key</Label>
                <Input type="password" value={config.anthropicApiKey} onChange={e => setConfig({...config, anthropicApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mistral Key</Label>
                <Input type="password" value={config.mistralApiKey} onChange={e => setConfig({...config, mistralApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>DeepSeek Key</Label>
                <Input type="password" value={config.deepseekApiKey} onChange={e => setConfig({...config, deepseekApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>xAI (Zai) Key</Label>
                <Input type="password" value={config.xaiApiKey} onChange={e => setConfig({...config, xaiApiKey: e.target.value})} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Ollama Administration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Server URL</Label>
                <div className="flex gap-2">
                  <Input value={config.ollamaUrl} onChange={e => setConfig({...config, ollamaUrl: e.target.value})} />
                  <Button variant="outline" onClick={handleAutoDetect} disabled={detecting}>
                    {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-muted/20">
                <h4 className="font-bold text-sm mb-2">Installed Local Models</h4>
                <div className="flex flex-wrap gap-2">
                  {config.localModelList.map((m: string) => (
                    <Badge key={m} variant="secondary">{m}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Network Topology</CardTitle></CardHeader>
            <CardContent>
              <Select value={config.networkMode} onValueChange={v => setConfig({...config, networkMode: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internet">Internet-Accessible</SelectItem>
                  <SelectItem value="local-only">Local Network Only</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
