
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings, Key, UserCheck, Loader2, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    async function fetchConfig() {
      const snap = await getDoc(doc(db, 'system', 'config'));
      if (snap.exists()) {
        setConfig(snap.data());
      }
      setLoading(false);
    }
    fetchConfig();
  }, [db]);

  const handleLocalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === config?.adminUsername && loginData.password === config?.adminPassword) {
      setIsAuthenticated(true);
      toast({ title: "Authenticated", description: "Local Admin access granted." });
    } else {
      toast({ variant: 'destructive', title: "Invalid Credentials", description: "Local admin login failed." });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), { ...config, updatedAt: new Date().toISOString() }, { merge: true });
      toast({ title: "Settings Updated", description: "Global configuration has been refreshed." });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const promoteUser = async (role: 'admin' | 'moderator' | 'trusted') => {
    if (!user) return;
    setSaving(true);
    try {
      let updates = {};
      if (role === 'admin') updates = { isAdmin: true };
      if (role === 'moderator') updates = { isModerator: true };
      if (role === 'trusted') updates = { isTrustedContributor: true };
      
      await updateDoc(doc(db, 'users', user.uid), updates);
      toast({ title: "User Promoted", description: `${user.displayName} is now a ${role}.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Promotion Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md shadow-xl border-primary/20">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="font-headline text-2xl">Admin Portal</CardTitle>
            <CardDescription>Authenticate via credentials stored during setup to manage the platform.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLocalLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Unlock Dashboard</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6 space-y-8 animate-in fade-in duration-500">
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Research Engine (Gemini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Gemini API Key</Label>
              <Input 
                type="password" 
                value={config?.geminiApiKey || ''} 
                onChange={e => setConfig({...config, geminiApiKey: e.target.value})} 
              />
              <p className="text-[10px] text-muted-foreground">Changes here affect all scholarly AI research flows instantly.</p>
            </div>
          </CardContent>
        </Card>

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
              <Button variant="outline" size="sm" onClick={() => promoteUser('admin')} disabled={!user || saving}>Promote</Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-4">
                <ShieldAlert className="h-6 w-6 text-accent" />
                <div>
                  <p className="font-bold text-sm">Wiki Moderator</p>
                  <p className="text-xs text-muted-foreground">Peer review pending entries.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => promoteUser('moderator')} disabled={!user || saving}>Promote</Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-bold text-sm">Trusted Contributor</p>
                  <p className="text-xs text-muted-foreground">Bypass peer review for wiki posts.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => promoteUser('trusted')} disabled={!user || saving}>Promote</Button>
            </div>

            {!user && <p className="text-xs italic text-center text-muted-foreground pt-2">Sign in with Google in the main app to enable role promotion.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
