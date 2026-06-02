'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Database, Sparkles, Activity, Key, CheckCircle2, Loader2, LogIn, Globe, WifiOff, Layers, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { cn } from '@/lib/utils';
import { DEFAULT_MODULES, GOVERNANCE_MODULES } from '@/config/modules';

export default function SetupWizard() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const [formData, setFormData] = useState({
    geminiApiKey: '',
    gaMeasurementId: '',
    matomoSiteId: '',
    matomoUrl: '',
    networkMode: 'internet',
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

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Authenticated", description: "You are now eligible to become the first System Admin." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Authentication Failed", description: error.message });
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: "Authentication Required", description: "Please sign in with Google to claim ownership of the first admin account." });
      setStep(4);
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. System Config with Tiers
      batch.set(doc(db, 'system', 'config'), {
        ...formData,
        isConfigured: true,
        apiTiers: [
          { name: "Basic", requestsPerDay: 20 },
          { name: "Scholar", requestsPerDay: 100 },
          { name: "Institution", requestsPerDay: 5000 }
        ],
        updatedAt: new Date().toISOString()
      });

      // 2. Comprehensive Module Seeding (Filtered to real modules only)
      const allModules = [...DEFAULT_MODULES, ...GOVERNANCE_MODULES];
      
      allModules.forEach(mod => {
        let iconName = 'globe';
        if (mod.id === 'dashboard') iconName = 'layout-dashboard';
        else if (mod.id === 'chat') iconName = 'message-square';
        else if (mod.id === 'wiki') iconName = 'graduation-cap';
        else if (mod.id === 'wiki-moderation') iconName = 'user-check';
        else if (mod.id === 'ai-assistant') iconName = 'sparkles';
        else if (mod.id === 'theology') iconName = 'history';
        else if (mod.id === 'manuscripts') iconName = 'file-search';
        else if (mod.id === 'lexicon') iconName = 'book-open';
        else if (mod.id === 'synthesis') iconName = 'feather';
        else if (mod.id === 'verse-explorer') iconName = 'notebook-pen';
        else if (mod.id === 'geography') iconName = 'globe';
        else if (mod.id === 'timeline') iconName = 'clock';
        else if (mod.id === 'translation-compare') iconName = 'arrow-left-right';
        else if (mod.id === 'library') iconName = 'library';
        else if (mod.id === 'profile' || mod.labelKey === 'nav.api_portal') iconName = 'key';
        else if (mod.labelKey === 'nav.audit') iconName = 'activity';
        else if (mod.labelKey === 'nav.admin_api') iconName = 'key';
        else if (mod.id === 'archaeology') iconName = 'landmark';

        const docId = (mod.id + '-' + (mod.path?.replace(/\//g, '') || 'tab')).toLowerCase();
        batch.set(doc(db, 'modules', docId), {
          id: mod.id,
          labelKey: mod.labelKey,
          iconName: iconName,
          group: mod.group,
          enabled: true,
          adminOnly: mod.adminOnly || false,
          path: mod.path || null,
          createdAt: new Date().toISOString()
        });
      });

      // 3. Admin User Promotion
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        isAdmin: true,
        isModerator: true,
        isTrustedContributor: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await batch.commit();

      toast({ title: "Configuration Saved", description: "Your scholarly workspace is ready with Tiered Access and AI Governance." });
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

  const progress = (step / 5) * 100;

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
                <Globe className="h-5 w-5" />
                <h3>Network Topology</h3>
              </div>
              <p className="text-sm text-muted-foreground">Is this application exposed to the public internet or isolated to a local network?</p>
              <div className="grid gap-4">
                <div 
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4",
                    formData.networkMode === 'internet' ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setFormData({...formData, networkMode: 'internet'})}
                >
                  <Globe className={cn("h-8 w-8", formData.networkMode === 'internet' ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-bold text-sm">Internet-Accessible</p>
                    <p className="text-[10px] text-muted-foreground">Standard cloud-enabled scholarly collaboration.</p>
                  </div>
                </div>

                <div 
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4",
                    formData.networkMode === 'local-only' ? "border-green-600 bg-green-600/5" : "border-muted hover:border-muted-foreground/30"
                  )}
                  onClick={() => setFormData({...formData, networkMode: 'local-only'})}
                >
                  <WifiOff className={cn("h-8 w-8", formData.networkMode === 'local-only' ? "text-green-600" : "text-muted-foreground")} />
                  <div>
                    <p className="font-bold text-sm">Local Network Only</p>
                    <p className="text-[10px] text-muted-foreground">Isolated intranet or air-gapped installation.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Sparkles className="h-5 w-5" />
                <h3>AI Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">Provide a default Google Gemini API key to power the research synthesis engine for guests.</p>
              <div className="space-y-2">
                <Label htmlFor="gemini">System Gemini API Key</Label>
                <Input 
                  id="gemini" 
                  type="password" 
                  placeholder="Paste system API key here..." 
                  value={formData.geminiApiKey} 
                  onChange={e => setFormData({...formData, geminiApiKey: e.target.value})} 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Layers className="h-5 w-5" />
                <h3>Governance Provisioning</h3>
              </div>
              <p className="text-sm text-muted-foreground">The platform will initialize **Tiered Access Control** and the following modules:</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-muted/30 rounded-lg border">
                {[...DEFAULT_MODULES, ...GOVERNANCE_MODULES].map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span className="truncate">{m.id}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                <ShieldAlert className="h-4 w-4 text-accent" />
                <p className="text-[10px] text-muted-foreground italic">Default tiers: Basic (20), Scholar (100), Institution (5000) queries/day.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary font-bold">
                <Key className="h-5 w-5" />
                <h3>Admin Ownership</h3>
              </div>
              <p className="text-sm text-muted-foreground">To secure the platform, the first System Administrator must be linked to a verified Google account.</p>
              
              {user ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 justify-center">
                  <CheckCircle2 className="text-green-600 h-6 w-6" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-green-800">Linked to: {user.email}</p>
                    <p className="text-[10px] text-green-700">This account will become the root administrator.</p>
                  </div>
                </div>
              ) : (
                <Button onClick={handleLogin} className="w-full h-12">
                  <LogIn className="mr-2 h-5 w-5" /> Authenticate Admin Account
                </Button>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-95">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-bold font-headline">Ready for Deployment</h3>
              <p className="text-sm text-muted-foreground">All parameters validated. Tiers and modules are prepared for installation.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between bg-muted/20 p-6 rounded-b-lg border-t">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || loading}>Previous</Button>
          {step < 5 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 4 && !user}>Continue</Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading || !user} className="bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Complete Secure Installation
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
