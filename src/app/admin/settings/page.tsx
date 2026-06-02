
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  ShieldCheck, 
  Settings, 
  Loader2, 
  Save, 
  Server,
  Network,
  Plus,
  Trash2,
  Globe,
  WifiOff,
  RefreshCw,
  Download,
  Database,
  Cpu,
  Brain,
  Sparkles,
  Fingerprint,
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getLocalOllamaModels, pullOllamaModel, deleteOllamaModel, pingOllama } from '@/app/actions/ollama-actions';

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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isOllamaUp, setIsOllamaUp] = useState<boolean | null>(null);

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
    networkMode: 'internet',
    ssoConfig: {
      enabled: false,
      providerId: '',
      type: 'saml',
      label: 'Seminary Login'
    }
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
          setConfig((prev: any) => ({
            ...prev,
            ...data
          }));
        }
        // Check Ollama status
        const ping = await pingOllama(config.ollamaUrl);
        setIsOllamaUp(ping.success);
      } catch (e) {
        console.error("Permission denied fetching system config");
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && !profileLoading) fetchConfig();
  }, [db, isAdmin, authLoading, profileLoading, config.ollamaUrl]);

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
      if (result.models) {
        setConfig({ ...config, localModelList: result.models });
        setIsOllamaUp(true);
        toast({ title: "Models Detected", description: `${result.models.length} models found on local server.` });
      } else {
        setIsOllamaUp(false);
        toast({ variant: 'destructive', title: "Connection Failed", description: result.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Detection Failed" });
    } finally {
      setDetecting(false);
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    setPulling(true);
    toast({ title: "Pull Initiated", description: `Downloading ${pullModelName}... this may take a few minutes.` });
    try {
      const result = await pullOllamaModel(pullModelName, config.ollamaUrl);
      if (result.success) {
        toast({ title: "Model Pulled", description: `${pullModelName} is now ready for local use.` });
        handleAutoDetect();
        setPullModelName('');
      } else {
        toast({ variant: 'destructive', title: "Pull Failed", description: result.error });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Error", description: e.message });
    } finally {
      setPulling(false);
    }
  };

  const handleDeleteModel = async (model: string) => {
    if (!confirm(`Permanently remove ${model} from the local server?`)) return;
    setDeleting(model);
    try {
      const result = await deleteOllamaModel(model, config.ollamaUrl);
      if (result.success) {
        toast({ title: "Model Deleted" });
        handleAutoDetect();
      } else {
        toast({ variant: 'destructive', title: "Deletion Failed", description: result.error });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Error" });
    } finally {
      setDeleting(null);
    }
  };

  if (!user || !isAdmin) return <div className="p-20 text-center">Unauthorized</div>;
  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
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
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="ai" className="gap-2"><Globe className="h-4 w-4" /> Cloud Tiers</TabsTrigger>
          <TabsTrigger value="local" className="gap-2"><Server className="h-4 w-4" /> Local Ollama</TabsTrigger>
          <TabsTrigger value="auth" className="gap-2"><Fingerprint className="h-4 w-4" /> Authentication</TabsTrigger>
          <TabsTrigger value="network" className="gap-2"><Network className="h-4 w-4" /> Network Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Fallback System Keys</CardTitle>
              <CardDescription>Provide global keys to power guest research and tiered API access.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3 w-3 text-primary" /> Google Gemini Key</Label>
                <Input type="password" value={config.geminiApiKey} onChange={e => setConfig({...config, geminiApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cpu className="h-3 w-3 text-primary" /> OpenAI Key</Label>
                <Input type="password" value={config.openaiApiKey} onChange={e => setConfig({...config, openaiApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Brain className="h-3 w-3 text-primary" /> Anthropic Key</Label>
                <Input type="password" value={config.anthropicApiKey} onChange={e => setConfig({...config, anthropicApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-primary" /> Mistral Key</Label>
                <Input type="password" value={config.mistralApiKey} onChange={e => setConfig({...config, mistralApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cpu className="h-3 w-3 text-primary" /> DeepSeek Key</Label>
                <Input type="password" value={config.deepseekApiKey} onChange={e => setConfig({...config, deepseekApiKey: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Cpu className="h-3 w-3 text-primary" /> xAI (Zai) Key</Label>
                <Input type="password" value={config.xaiApiKey} onChange={e => setConfig({...config, xaiApiKey: e.target.value})} />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4">
               <p className="text-[10px] text-muted-foreground italic">
                 <strong>Note:</strong> System keys are used when a researcher hasn't provided their own, subject to Tiered Rate Limits.
               </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="local" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                   <Server className="h-5 w-5 text-primary" /> Ollama Administration
                </CardTitle>
                <Badge variant={isOllamaUp ? "outline" : "destructive"} className={cn(isOllamaUp && "border-green-500 text-green-600")}>
                  {isOllamaUp ? "SERVER REACHABLE" : "SERVER UNREACHABLE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Server URL</Label>
                <div className="flex gap-2">
                  <Input value={config.ollamaUrl} onChange={e => setConfig({...config, ollamaUrl: e.target.value})} placeholder="http://localhost:11434" />
                  <Button variant="outline" onClick={handleAutoDetect} disabled={detecting}>
                    {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Download className="h-4 w-4" /> Pull New Model
                  </h4>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. llama3.2" 
                      value={pullModelName} 
                      onChange={e => setPullModelName(e.target.value)} 
                      disabled={pulling || !isOllamaUp}
                    />
                    <Button onClick={handlePullModel} disabled={pulling || !pullModelName.trim() || !isOllamaUp}>
                      {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" /> Installed Library
                  </h4>
                  <div className="border rounded-lg p-4 bg-muted/20 min-h-[100px] space-y-2">
                    {(config.localModelList || []).map((m: string) => (
                      <div key={m} className="flex items-center justify-between p-2 bg-background rounded border group">
                        <span className="text-xs font-mono">{m}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteModel(m)}
                          disabled={deleting === m}
                        >
                          {deleting === m ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                    {!config.localModelList?.length && (
                      <p className="text-center text-[10px] text-muted-foreground italic py-8">No models detected.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Institutional SSO (SAML/OIDC)
              </CardTitle>
              <CardDescription>Configure enterprise-grade single sign-on for your institution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Institutional SSO</Label>
                  <p className="text-xs text-muted-foreground">Allow researchers to sign in via seminary identity providers.</p>
                </div>
                <Switch 
                  checked={config.ssoConfig?.enabled} 
                  onCheckedChange={val => setConfig({
                    ...config, 
                    ssoConfig: { ...(config.ssoConfig || {}), enabled: val }
                  })} 
                />
              </div>

              <div className={cn("grid gap-6 md:grid-cols-2", !config.ssoConfig?.enabled && "opacity-50 pointer-events-none")}>
                <div className="space-y-2">
                  <Label>SSO Provider Type</Label>
                  <Select 
                    value={config.ssoConfig?.type || 'saml'} 
                    onValueChange={val => setConfig({
                      ...config, 
                      ssoConfig: { ...(config.ssoConfig || {}), type: val }
                    })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saml">SAML (Generic / Azure / Okta)</SelectItem>
                      <SelectItem value="oidc">OpenID Connect (OIDC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Provider ID</Label>
                  <Input 
                    placeholder="e.g. saml.my-seminary" 
                    value={config.ssoConfig?.providerId || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      ssoConfig: { ...(config.ssoConfig || {}), providerId: e.target.value }
                    })}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Match this with the ID configured in Firebase Console.</p>
                </div>
                <div className="space-y-2">
                  <Label>Button Label</Label>
                  <Input 
                    placeholder="e.g. Sign in with Oxford ID" 
                    value={config.ssoConfig?.label || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      ssoConfig: { ...(config.ssoConfig || {}), label: e.target.value }
                    })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4">
               <div className="flex items-start gap-2">
                 <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                 <p className="text-[10px] text-muted-foreground leading-relaxed">
                   <strong>Security Note:</strong> SSO requires active configuration in the Firebase Project settings. Ensure you have added the corresponding SAML/OIDC provider and authorized the redirect URIs.
                 </p>
               </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" /> Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Exposure</Label>
                <Select value={config.networkMode} onValueChange={v => setConfig({...config, networkMode: v})}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internet">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span>Internet-Accessible (Standard Cloud Collaboration)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="local-only">
                      <div className="flex items-center gap-2">
                        <WifiOff className="h-4 w-4 text-green-600" />
                        <span>Local Network Only (Air-gapped / Private Institutional Use)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Alert className="bg-accent/5 border-accent/20">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <AlertTitle>Network Mode Enforcement</AlertTitle>
                <AlertDescription className="text-xs">
                  Changing to "Local-Only" will disable all cloud-based AI providers and scripture APIs that require public internet access.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
