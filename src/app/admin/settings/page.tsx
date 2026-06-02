
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Settings, Key, Globe, LayoutDashboard, Loader2, Save, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === config.adminUsername && loginData.password === config.adminPassword) {
      setIsAuthenticated(true);
      toast({ title: "Authenticated", description: "Welcome back, Admin." });
    } else {
      toast({ variant: 'destructive', title: "Invalid Credentials" });
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

  const promoteUserToAdmin = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { isAdmin: true });
      toast({ title: "User Promoted", description: `${user.displayName} is now a system administrator.` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Promotion Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle className="font-headline text-2xl">Admin Authentication</CardTitle>
            <CardDescription>Enter your local admin credentials to manage the platform.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
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
              <Button type="submit" className="w-full">Sign In</Button>
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
            <Settings className="text-primary h-8 w-8" /> System Administration
          </h1>
          <p className="text-muted-foreground">Manage scholarly engines, analytics, and access rights.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Gemini API Key (Live)</Label>
              <Input 
                type="password" 
                value={config.geminiApiKey} 
                onChange={e => setConfig({...config, geminiApiKey: e.target.value})} 
              />
              <p className="text-[10px] text-muted-foreground">Updates made here will take effect immediately for all research flows.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Analytics & Tracking</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
               <Label>GA4 Measurement ID</Label>
               <Input value={config.gaMeasurementId} onChange={e => setConfig({...config, gaMeasurementId: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Matomo Site ID</Label>
               <Input value={config.matomoSiteId} onChange={e => setConfig({...config, matomoSiteId: e.target.value})} />
             </div>
             <div className="md:col-span-2 space-y-2">
               <Label>Matomo Instance URL</Label>
               <Input value={config.matomoUrl} onChange={e => setConfig({...config, matomoUrl: e.target.value})} />
             </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-accent"><Link2 className="h-5 w-5" /> OAuth Admin Link</CardTitle>
            <CardDescription>Grant administrative privileges to your current Google account.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full border border-accent bg-accent/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="font-bold text-sm">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ) : <p className="text-sm italic">Sign in with Google to enable linking.</p>}
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white" onClick={promoteUserToAdmin} disabled={!user || saving}>
              Link & Promote
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
