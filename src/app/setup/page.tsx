
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Database, Sparkles, Activity, Key, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupWizard() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [formData, setFormData] = useState({
    geminiApiKey: '',
    gaMeasurementId: '',
    matomoSiteId: '',
    matomoUrl: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    async function checkConfig() {
      const configRef = doc(db, 'system', 'config');
      const snap = await getDoc(configRef);
      if (snap.exists() && snap.data().isConfigured) {
        router.push('/admin/settings');
      }
      setIsChecking(false);
    }
    checkConfig();
  }, [db, router]);

  const handleComplete = async () => {
    if (formData.adminPassword !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: "Passwords don't match" });
      return;
    }
    setLoading(true);
    try {
      await setDoc(doc(db, 'system', 'config'), {
        ...formData,
        isConfigured: true,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Configuration Saved", description: "Your scholarly workspace is now ready." });
      router.push('/');
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Setup Failed", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-xl shadow-2xl border-primary/20">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-2xl font-headline">Scholarly Setup Wizard</CardTitle>
              <CardDescription className="text-primary-foreground/70">Initialize your LexiVerse Explorer environment.</CardDescription>
            </div>
          </div>
          <Progress value={progress} className="mt-6 bg-primary-foreground/20 h-2" />
        </CardHeader>
        
        <CardContent className="pt-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Sparkles className="h-5 w-5" />
                <h3>AI Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">Provide your Google Gemini API key to power the research synthesis engine.</p>
              <div className="space-y-2">
                <Label htmlFor="gemini">Gemini API Key</Label>
                <Input 
                  id="gemini" 
                  type="password" 
                  placeholder="Paste your API key here..." 
                  value={formData.geminiApiKey} 
                  onChange={e => setFormData({...formData, geminiApiKey: e.target.value})} 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Activity className="h-5 w-5" />
                <h3>Analytics Integration</h3>
              </div>
              <p className="text-sm text-muted-foreground">Optional: Track research engagement with Google Analytics or Matomo.</p>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>GA4 Measurement ID</Label>
                  <Input placeholder="G-XXXXXXXXXX" value={formData.gaMeasurementId} onChange={e => setFormData({...formData, gaMeasurementId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Matomo Site ID</Label>
                  <Input placeholder="e.g. 1" value={formData.matomoSiteId} onChange={e => setFormData({...formData, matomoSiteId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Matomo Instance URL</Label>
                  <Input placeholder="https://analytics.yoursite.com" value={formData.matomoUrl} onChange={e => setFormData({...formData, matomoUrl: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Key className="h-5 w-5" />
                <h3>Admin Credentials</h3>
              </div>
              <p className="text-sm text-muted-foreground">Create your local administrator account for managing the platform.</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="admin" value={formData.adminUsername} onChange={e => setFormData({...formData, adminUsername: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-95">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold font-headline">Ready for Deployment</h3>
              <p className="text-sm text-muted-foreground">All parameters have been validated. Click complete to finalize your scholarly environment.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between bg-muted/20 p-6 rounded-b-lg border-t">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || loading}>Previous</Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)}>Continue</Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Installation
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
