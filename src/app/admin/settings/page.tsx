
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
  Database,
  Server,
  Network,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  AlertCircle,
  Globe,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

export default function AdminSettings() {
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  
  const userRef = user ? doc(db, 'users', user.uid) : null;
  const { data: userProfile, loading: profileLoading } = useDoc<any>(userRef);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>({
    geminiApiKey: '',
    ollamaUrl: 'http://localhost:11434',
    defaultModelProvider: 'google',
    localModelList: ['llama3', 'mistral', 'gemma'],
    networkMode: 'internet'
  });
  const [newModelName, setNewModelName] = useState('');

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
            ...data,
            localModelList: data.localModelList || ['llama3', 'mistral', 'gemma'],
            networkMode: data.networkMode || 'internet'
          });
        }
      } catch (e) {
        console.error("Permission denied fetching system config");
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && !profileLoading) {
      fetchConfig();
    }
  }, [db, isAdmin, authLoading, profileLoading]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), { ...config, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Settings Updated", description: "Global configuration has been refreshed." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: "You do not have permission to modify system configuration." });
    } finally {
      setSaving(false);
    }
  };

  const addModel = () => {
    if (!newModelName.trim()) return;
    if (config.localModelList.includes(newModelName.trim())) {
      toast({ variant: 'destructive', title: "Model already exists" });
      return;
    }
    setConfig({
      ...config,
      localModelList: [...config.localModelList, newModelName.trim()]
    });
    setNewModelName('');
  };

  const removeModel = (model: string) => {
    setConfig({
      ...config,
      localModelList: config.localModelList.filter((m: string) => m !== model)
    });
  };

  const promoteUser = async (role: 'admin' | 'moderator' | 'trusted') => {
    if (!user || !isAdmin) return;
    setSaving(true);
    try {
      let updates = {};
      if (role === 'admin') updates = { isAdmin: true };
      if (role === 'moderator') updates = { isModerator: true };
      if (role === 'trusted') updates = { isTrustedContributor: true };
      
      await updateDoc(doc(db, 'users', user.uid), updates);
      toast({ title: "User Promoted", description: `${user.displayName} is now a ${role}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Promotion Failed", description: "Permission denied." });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading || (isAdmin && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6 text-center">
        <Card className="w-full max-w-md shadow-xl border-destructive/20">
          <CardHeader>
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="font-headline text-2xl">Access Denied</CardTitle>
            <CardDescription>
              This portal is restricted to System Administrators. Your academic credentials do not grant access to global system parameters.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/'}>
              Return to Research
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Settings className="text-primary h-8 w-8" /> System Control Panel
          </h1>
          <p className="text-muted-foreground">Manage scholarly engines, roles, and global parameters.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Configuration
        </Button>
      </header>

      <Alert className="bg-primary/5 border-primary/20">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Secure Session Active</AlertTitle>
        <AlertDescription className="text-xs">
          Authenticated as <strong>{userProfile?.displayName}</strong> (System Administrator). All changes are logged for academic transparency.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="ai">AI Engine Config</TabsTrigger>
          <TabsTrigger value="network">Network Topology</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Cloud Research (Google)</CardTitle>
                <CardDescription>
                  Configure the default fallback key for guest researchers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>System Gemini API Key</Label>
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        Get Key <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  <Input 
                    type="password" 
                    value={config?.geminiApiKey || ''} 
                    onChange={e => setConfig({...config, geminiApiKey: e.target.value})} 
                    placeholder="Enter system Google AI API key"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    This key powers research for users who haven't supplied their own in their profile.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Local Inference (Ollama)</CardTitle>
                <CardDescription>Manage multiple locally hosted models.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ollama Server Address</Label>
                  <Input 
                    placeholder="http://localhost:11434"
                    value={config?.ollamaUrl || ''} 
                    onChange={e => setConfig({...config, ollamaUrl: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-4 border-t pt-4">
                  <Label>Manage Models</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. llama3.1" 
                      value={newModelName}
                      onChange={e => setNewModelName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addModel()}
                    />
                    <Button size="icon" onClick={addModel}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {config.localModelList.map((model: string) => (
                      <Badge key={model} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-2">
                        {model}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeModel(model)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {config.localModelList.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No local models configured.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label>Default Provider</Label>
                  <Select 
                    value={config?.defaultModelProvider || 'google'} 
                    onValueChange={(val) => setConfig({...config, defaultModelProvider: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Gemini (Cloud - Preferred)</SelectItem>
                      <SelectItem value="local">Ollama (Local)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Network className="h-5 w-5 text-primary" /> Connectivity Mode</CardTitle>
              <CardDescription>Inform the application of its network topology.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div 
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4",
                    config.networkMode === 'internet' ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setConfig({...config, networkMode: 'internet'})}
                >
                  <Globe className={cn("h-12 w-12", config.networkMode === 'internet' ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <h3 className="font-bold">Internet-Accessible</h3>
                    <p className="text-xs text-muted-foreground mt-1">Application is exposed to the public internet. Enables external API fallbacks and global collaboration.</p>
                  </div>
                </div>

                <div 
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4",
                    config.networkMode === 'local-only' ? "border-green-600 bg-green-600/5" : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setConfig({...config, networkMode: 'local-only'})}
                >
                  <WifiOff className={cn("h-12 w-12", config.networkMode === 'local-only' ? "text-green-600" : "text-muted-foreground")} />
                  <div>
                    <h3 className="font-bold">Local Network Only</h3>
                    <p className="text-xs text-muted-foreground mt-1">Application is strictly isolated to a local network (Air-gapped or Intranet). Disables analytics and remote syncing.</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-2">
                  <p className="font-bold">Why inform the app?</p>
                  <p>Informing the application of its network mode allows the Lexiverse research engine to optimize for available resources. In **Local Network Only** mode, the system emphasizes Ollama local inference and IndexedDB document storage, providing a seamless "dark" scholarly workspace.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-accent"><UserCheck className="h-5 w-5" /> Role Management</CardTitle>
              <CardDescription>Grant specific scholarly permissions to your linked Google account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-bold text-sm">System Administrator</p>
                    <p className="text-xs text-muted-foreground">Full access to settings.</p>
                  </div>
                </div>
                <Badge className="bg-primary">ACTIVE</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="h-6 w-6 text-accent" />
                  <div>
                    <p className="font-bold text-sm">Wiki Moderator</p>
                    <p className="text-xs text-muted-foreground">Peer review pending entries.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => promoteUser('moderator')} disabled={saving}>
                  {userProfile?.isModerator ? 'Verified' : 'Promote'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-bold text-sm">Trusted Contributor</p>
                    <p className="text-xs text-muted-foreground">Bypass peer review for wiki posts.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => promoteUser('trusted')} disabled={saving}>
                  {userProfile?.isTrustedContributor ? 'Verified' : 'Promote'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
